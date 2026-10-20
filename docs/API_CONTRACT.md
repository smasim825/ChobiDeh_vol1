# API Contract & Endpoint Specification

This document details the API endpoints for ChobiDeh, specifying the contracts for the Three-Level Matching System, Review Suggestions, and Rest Photos.

---

## 1. Authentication & Security Headers

All requests to `/rooms/*` endpoints require standard Supabase JWT Bearer authentication:
```http
Authorization: Bearer <supabase_jwt>
```
The server validates room membership via Row-Level Security (RLS) or middleware. Access to rooms, photos, suggestions, and corrections without active membership returns `403 Forbidden`.

---

## 2. Photo Gallery & People Collections (Level 1 & Level 3)

### `GET /rooms/:roomId/photos`
Retrieve photos for a room, filtered by person collection or Rest Photos category.

#### Query Parameters:
* `view` (string, optional): `'people'` (default) or `'rest'`
* `clusterId` (uuid, optional): Filter by specific person collection. If a photo contains multiple people, it will match queries for any of those people.
* `restCategory` (string, optional): Filter Rest Photos by subcategory:
  * `'unknown_faces'`: Photos with detected human faces that are not assigned to any person.
  * `'no_people'`: Photos with zero detected human faces (scenic, sunsets, food, architecture).
  * `'other_unassigned'`: Photos with blur, occlusion, or processing exceptions.
* `limit` (int, default: 50)
* `offset` (int, default: 0)

#### Response (200 OK):
```json
{
  "photos": [
    {
      "id": "7b583f6b-7347-4f24-9b16-83679c29f031",
      "roomId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "originalName": "coxs_bazar_sunset.webp",
      "url": "https://photos.chobideh.com/rooms/.../7b583f6b.webp",
      "thumbnailUrl": "https://photos.chobideh.com/rooms/.../thumb_7b583f6b.webp",
      "sizeBytes": 420816,
      "width": 2048,
      "height": 1536,
      "clusterLevel": "Level 1: Confident",
      "assignedPeople": [
        { "clusterId": "cluster_1", "displayName": "Tasnim" },
        { "clusterId": "cluster_2", "displayName": "Rafiqul" }
      ],
      "restCategory": null,
      "uploadedAt": "2026-10-21T01:30:00Z"
    }
  ],
  "total": 1,
  "roomPhotoCount": 342,
  "maxRoomPhotos": 1000
}
```

---

## 3. Review Suggestions (Level 2 Human-in-the-Loop)

### `GET /rooms/:roomId/suggestions`
Retrieve pending Level 2 close match suggestions requiring member confirmation.

#### Response (200 OK):
```json
{
  "suggestions": [
    {
      "id": "sug_8291a",
      "mediaId": "media_9821f",
      "photoUrl": "https://photos.chobideh.com/...",
      "faceInstanceId": "face_1120a",
      "faceBoundingBox": { "x": 0.25, "y": 0.3, "width": 0.2, "height": 0.25 },
      "suggestedPerson": {
        "clusterId": "cluster_1",
        "displayName": "Person 1 (Tasnim)",
        "similarityScore": 0.76
      },
      "candidatePeople": [
        { "clusterId": "cluster_1", "displayName": "Tasnim", "similarityScore": 0.76 },
        { "clusterId": "cluster_3", "displayName": "Samira", "similarityScore": 0.71 },
        { "clusterId": "cluster_4", "displayName": "Tanvir", "similarityScore": 0.68 }
      ],
      "status": "pending_review",
      "createdAt": "2026-10-21T02:00:00Z"
    }
  ]
}
```

---

### `POST /rooms/:roomId/suggestions/:suggestionId/resolve`
Confirm, correct, or reject an uncertain match suggestion.

#### Request Body:
```json
{
  "action": "correct",
  "correctedClusterId": "cluster_3"
}
```
* `action`:
  * `'confirm'`: Confirms the AI's `suggestedPerson`.
  * `'correct'`: Discards the suggestion for Person A and confirms assignment to `correctedClusterId` (Person B).
  * `'reject'`: Rejects the suggestion. **Rule:** Does NOT automatically assign to any other candidate. The photo remains in Rest Photos (*Unknown Faces*).

#### Response (200 OK):
```json
{
  "success": true,
  "suggestionId": "sug_8291a",
  "actionTaken": "corrected",
  "assignedCluster": {
    "clusterId": "cluster_3",
    "displayName": "Samira"
  },
  "undoToken": "undo_99182a",
  "message": "Suggestion resolved. Photo assigned to Samira."
}
```

---

### `POST /rooms/:roomId/suggestions/:suggestionId/undo`
Roll back the last review action or correction.

#### Request Body:
```json
{
  "undoToken": "undo_99182a"
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "suggestionId": "sug_8291a",
  "status": "pending_review",
  "message": "Correction undone. Suggestion restored to pending review."
}
```

---

## 4. Manual Tagging (Level 3 Rest Photos)

### `POST /rooms/:roomId/photos/:photoId/assign`
Manually tag an unknown face or entire photo to a person collection.

#### Request Body:
```json
{
  "clusterId": "cluster_2",
  "faceInstanceId": "face_1120a"
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "photoId": "photo_9821f",
  "assignedTo": {
    "clusterId": "cluster_2",
    "displayName": "Rafiqul"
  },
  "message": "Face successfully identified and added to Rafiqul's collection."
}
```
