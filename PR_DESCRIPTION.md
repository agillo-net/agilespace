# Add Track Change Support to Session Change Requests

## Overview

This PR extends the session change request functionality to support track changes in addition to duration changes. Previously, users could only request changes to session start/end times. Now they can also request to move sessions to different tracks within the same space.

## Changes Made

### Database Schema Updates

- **Renamed table**: `session_duration_change_requests` → `session_change_requests` to reflect broader scope
- **Added columns**:
  - `original_track_id` - References the original track
  - `requested_track_id` - References the requested track (nullable)
- **Updated constraints and indexes** to support track changes
- **Updated RLS policies** for the renamed table

### Frontend Component Updates

- **Renamed component**: `RequestDurationChangeDialog` → `RequestSessionChangeDialog`
- **Enhanced UI**: Added checkbox to enable track change and searchable track selector
- **Improved validation**: Ensures track changes are meaningful (different from original)
- **Better UX**: Shows current track and allows selection of new track

### API and Hook Updates

- **Enhanced mutations**: Support for track changes in create/approve operations
- **Improved validation**: Prevents approving requests that don't change anything
- **Better error handling**: Clear error messages for invalid track changes
- **Updated queries**: Include track information in change request data

### UI/UX Improvements

- **Updated terminology**: "Duration Change Requests" → "Session Change Requests"
- **Enhanced display**: Shows both original and requested track information
- **Better filtering**: Maintains existing filter functionality
- **Improved timestamps**: More precise time display with seconds

## Key Features

### Track Change Request Flow

1. User selects a session and clicks "Request Change"
2. User can optionally check "Change Track" checkbox
3. If checked, user selects a new track from available tracks
4. User provides reason for the change
5. Request is submitted for review

### Validation Rules

- Cannot request change to the same track
- Cannot approve requests that don't change anything (time or track)
- Track changes are optional - duration-only changes still work

### Review Process

- Admins can see both original and requested track information
- Clear visual comparison between original and requested values
- Same approval/rejection workflow as before

## Testing Considerations

- [ ] Test track change requests with different track selections
- [ ] Verify validation prevents same-track requests
- [ ] Test approval/rejection of track change requests
- [ ] Ensure duration-only requests still work correctly
- [ ] Verify UI displays track information correctly
- [ ] Test filtering and search functionality

## Migration Notes

- Database migration renames existing table and adds new columns
- Existing change requests will continue to work
- New track-related fields will be null for existing requests

## Screenshots

_[Add screenshots of the new track change UI here]_

## Breaking Changes

- Table name change from `session_duration_change_requests` to `session_change_requests`
- Component name change from `RequestDurationChangeDialog` to `RequestSessionChangeDialog`

## Related Issues

- Closes #[Issue number for track change requests]
- Addresses user feedback about needing to move sessions between tracks
