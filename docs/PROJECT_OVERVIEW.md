# Project Overview

## Vision

Build ChobiDeh as a privacy-conscious, room-based photo-sharing and AI organization platform. Users upload selected photos to a shared room. The system organizes those photos into collections based on people who appear in them, while allowing users to review and correct uncertain matches.

## Problem

After a group event or trip, photos are scattered across different phones and messaging threads. People spend time asking others to send photos, downloading duplicates, and manually finding photos in which they appear.

## Primary users

- A room creator organizing a shared event or trip.
- Room members contributing selected photos.
- Members browsing person-based collections.
- Members reviewing close match suggestions and correcting errors.

## MVP outcomes

1. A user can sign up, log in, and manage a basic profile.
2. A user can create a room and share its room ID and joining credential.
3. Authorized members can join and upload photos they select.
4. Photos remain private to authorized room members.
5. The system organizes room photos using a 3-Level Photo Matching & Grouping system:
   - **Level 1 — High Confidence:** Automatically matches faces to person collections. If multiple people appear in one photo, links that single photo to every matched person's collection.
   - **Level 2 — Close Match Suggestions:** Presents borderline matches in a Review Suggestions section with closest candidate people. Enables confirming, correcting (A → B), rejecting without auto-assigning, and undoing mistakes. Never retrains the model from user corrections.
   - **Level 3 — Rest Photos:** Organizes unassigned photos into three distinct filters: **Unknown Faces** (detected but unassigned; manually taggable), **No People** (scenic, sunsets, food), and **Other Unassigned** (processing exceptions/blur). Never confuses unknown faces with scenery.
6. Users can name, edit, and review anonymous person collections without mandatory face registration or selfie enrollment.
7. Users can correct assignments, review merge suggestions, and request deletion of their data/clusters.
8. The system provides Dual Exports: **Save to Phone** (in-browser ZIP) and **Export to Google Drive** (cloud-to-cloud backup).
9. The system is testable, observable, and deployable without unnecessary infrastructure.

## Non-goals for MVP

- Mandatory face registration, selfie enrollment, or linking faces to user accounts.
- Automatic scanning of the entire phone gallery.
- Full travel booking or destination marketplace.
- Expense splitting or money transfers.
- Messaging or social feed.
- Guaranteed recognition of every person in every photo.
- Public photo links or public-by-default rooms.
- Microservices, Kubernetes, or multi-region infrastructure without demonstrated need.

## Product principles

- Privacy and consent first.
- Room-based authorization.
- Human review for uncertain matches.
- Store original media once and reference it relationally from multiple collections.
- Model stability: User corrections never retrain or modify the AI model weights.
- Make failures visible and recoverable.
- Keep operating costs at $0.00 using Cloudflare R2 and client-side compression.
- Design modularly so travel features can be added later.
