-- Migration: 20261023000000_storage_and_room_cap.sql
-- Description: Enforces 1,000 photo cap per room and provides confirm_upload RPC for direct-to-storage pipeline.

-- ============================================================================
-- 1. ROOM PHOTO CAPACITY ENFORCEMENT (1,000 PHOTOS MAX)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_room_media_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.media
    WHERE room_id = NEW.room_id
      AND upload_status IN ('pending', 'uploaded')
      AND deleted_at IS NULL
  ) >= 1000 THEN
    RAISE EXCEPTION 'Room has reached the maximum capacity of 1,000 photos.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_room_media_cap ON public.media;
CREATE TRIGGER trg_enforce_room_media_cap
BEFORE INSERT ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.check_room_media_cap();

-- ============================================================================
-- 2. UPDATE create_upload TO ENFORCE PHOTO CAP AND RETURN KEY
-- ============================================================================
DROP FUNCTION IF EXISTS public.create_upload(uuid, text, bigint);
CREATE OR REPLACE FUNCTION public.create_upload(
    target_room_id uuid,
    content_type text,
    size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_media_id uuid;
    v_storage_key text;
    v_count int;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT public.is_room_member(target_room_id) THEN
        RAISE EXCEPTION 'Access denied: not a member of this room.';
    END IF;

    -- Enforce 1,000 photo cap
    SELECT count(*) INTO v_count
    FROM public.media
    WHERE room_id = target_room_id
      AND upload_status IN ('pending', 'uploaded')
      AND deleted_at IS NULL;

    IF v_count >= 1000 THEN
        RAISE EXCEPTION 'Room has reached the maximum capacity of 1,000 photos.';
    END IF;

    IF content_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif') THEN
        RAISE EXCEPTION 'Unsupported content type.';
    END IF;

    IF size_bytes <= 0 OR size_bytes > 26214400 THEN
        RAISE EXCEPTION 'File size must be between 1 byte and 25MB.';
    END IF;

    v_media_id := extensions.gen_random_uuid();
    v_storage_key := 'rooms/' || target_room_id::text || '/' || v_media_id::text;

    INSERT INTO public.media (
        id, room_id, uploaded_by, storage_key, content_type, size_bytes, upload_status, processing_status
    )
    VALUES (
        v_media_id, target_room_id, v_user_id, v_storage_key, content_type, size_bytes, 'pending', 'pending'
    );

    RETURN jsonb_build_object(
        'media_id', v_media_id,
        'storage_key', v_storage_key
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) TO authenticated;

-- ============================================================================
-- 3. CONFIRM UPLOAD RPC
-- ============================================================================
DROP FUNCTION IF EXISTS public.confirm_upload(uuid, bigint, text);
CREATE OR REPLACE FUNCTION public.confirm_upload(
    target_media_id uuid,
    actual_size_bytes bigint DEFAULT NULL,
    actual_content_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_media record;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_media
    FROM public.media
    WHERE id = target_media_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Media not found.';
    END IF;

    IF v_media.uploaded_by <> v_user_id THEN
        RAISE EXCEPTION 'Permission denied.';
    END IF;

    UPDATE public.media
    SET upload_status = 'uploaded',
        size_bytes = COALESCE(actual_size_bytes, size_bytes),
        content_type = COALESCE(actual_content_type, content_type),
        updated_at = now()
    WHERE id = target_media_id;

    RETURN jsonb_build_object('success', true, 'media_id', target_media_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_upload(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_upload(uuid, bigint, text) TO authenticated;
