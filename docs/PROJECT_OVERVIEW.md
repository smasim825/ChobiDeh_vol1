# Project Overview

## Vision

Build ChobiDeh as a privacy-conscious, room-based photo-sharing and AI organization platform. Users upload selected photos to a shared room. The system can organize those photos into collections based on people who appear in them, while allowing users to review and correct uncertain matches.

## Problem

After a group event or trip, photos are scattered across different phones and messaging threads. People spend time asking others to send photos, downloading duplicates, and manually finding photos in which they appear.

## Primary users

- A room creator organizing a shared event or trip.
- Room members contributing selected photos.
- Members browsing person-based collections.
- Members reviewing uncertain matches and correcting errors.

## MVP outcomes

1. A user can sign up, log in, and manage a basic profile.
2. A user can create a room and share its room ID and joining credential.
3. Authorized members can join and upload photos they select.
4. Photos remain private to authorized room members.
5. The system organizes room photos using a 3-Level AI Face Clustering workflow (Level 1: Confident Clustering, Level 2: Uncertain Matches, Level 3: Unsorted).
6. Users can name, edit, and review anonymous person collections without mandatory face registration or selfie enrollment.
7. Users can correct assignments, review merge suggestions, and request deletion of their data/clusters.
8. The system is testable, observable, and deployable without unnecessary infrastructure.

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
- Store original media once and reference it from multiple collections.
- Make failures visible and recoverable.
- Keep initial operating costs low.
- Design modularly so travel features can be added later.

## Success measures to establish during beta

- Percentage of invited members who successfully join.
- Percentage of members who upload at least one photo.
- Upload failure rate and median processing time.
- Precision of automatically assigned matches on a consented test set.
- Percentage of AI suggestions accepted/rejected by users.
- Number of manual corrections per 100 processed photos.
- User-reported usefulness and willingness to use the product again.

Do not set accuracy claims or numeric targets until a representative validation set and measurement method exist.
