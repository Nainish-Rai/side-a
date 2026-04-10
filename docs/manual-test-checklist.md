# Manual Testing Checklist - Crossfade Feature

## Prerequisites
1. Start development server: `npm run dev` or `pnpm dev`
2. Have at least 2 tracks in a queue for testing

## Test Cases

### Test 1: Settings Persistence

**Steps:**
1. Navigate to http://localhost:3000/settings
2. Toggle crossfade ON (should show duration/pre-buffer info)
3. Refresh the page
4. Verify crossfade setting persists (still ON)
5. Toggle crossfade OFF
6. Refresh the page
7. Verify crossfade setting persists (still OFF)

**Expected Result:** ✅ Settings persist across page refreshes

---

### Test 2: Crossfade Functionality

**Steps:**
1. Enable crossfade in settings
2. Play a track with multiple tracks in queue
3. Wait until track reaches end minus 10 seconds
4. Observe:
   - Next track should start pre-buffering (check Network tab)
   - At end minus 5 seconds, crossfade should begin
5. Verify smooth volume transition:
   - Current track volume decreases from 1.0 to 0.0
   - Next track volume increases from 0.0 to 1.0
   - Transition completes in 5 seconds
6. Verify next track plays at correct position (time 0)

**Expected Result:** ✅ Smooth 5-second crossfade between tracks

---

### Test 3: Manual Skip During Crossfade

**Steps:**
1. Enable crossfade in settings
2. Start playing a track with next track in queue
3. Waitfor crossfade to begin
4. Press "Next" button to skip to next track manually
5. Verify:
   - Crossfade is cancelled immediately
   - Next track starts at time 0
   - Volume is restored to user's setting (not stuck at crossfade level)

**Expected Result:** ✅ Manual skip cancels crossfade cleanly

---

### Test 4: Empty Queue

**Steps:**
1. Enable crossfade in settings
2. Play a track with NO next track in queue
3. Wait until track ends
4. Verify:
   - No crossfade occurs (no errors)
   - Track ends normally
   - Playback stops

**Expected Result:** ✅ No crossfade when queue is empty

---

### Test 5: Repeat-One Mode

**Steps:**
1. Enable crossfade in settings
2. Enable repeat-one mode (loop single track)
3. Play a track
4. Wait until track reaches end
5. Verify:
   - Track restarts from beginning
   - No crossfade occurs

**Expected Result:** ✅ No crossfade in repeat-one mode

---

### Test 6: Volume Preservation

**Steps:**
1. Enable crossfade in settings
2. Set volume to 50% (0.5)
3. Play a track with next track in queue
4. Wait for crossfade to complete
5. Verify:
   - Volume is restored to 50% after crossfade
   - Not stuck at 100% or 0%

**Expected Result:** ✅ User's volume preserved after crossfade

---

### Test 7: Shuffle Mode

**Steps:**
1. Enable crossfade in settings
2. Enable shuffle mode
3. Play a track with multiple tracks in queue
4. Wait for crossfade to trigger
5. Verify:
   - Crossfade uses next track from shuffled queue
   - Not the next track from original queue order

**Expected Result:** ✅ Crossfade respects shuffled queue order

---

### Test 8: Rapid Track Changes

**Steps:**
1. Enable crossfade in settings
2. Rapidly skip through tracks (next, next, next)
3. Verify:
   - No audio overlap
   - No memory leaks
   - Each track starts cleanly

**Expected Result:** ✅ No issues with rapid track changes

---

### Test 9: Crossfade Toggle Mid-Track

**Steps:**
1. Start playing a track with crossfade OFF
2. Let track play for30 seconds
3. Enable crossfade in settings
4. Wait for track to end
5. Verify:
   - No crossfade occurs (controller needs re-initialization)
   - Track ends normally

**Expected Result:** ✅ Settings change requires page refresh to take effect

---

### Test 10: Console Errors

**Steps:**
1. Open browser console (F12 or right-click → Inspect → Console)
2. Enable crossfade
3. Play through multiple tracks with crossfade
4. Perform all above tests
5. Check console for:
   - JavaScript errors
   - React warnings
   - Failed network requests

**Expected Result:** ✅ No console errors throughout all tests

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Settings Persistence | ⬜ Not Tested | |
| Crossfade Functionality | ⬜ Not Tested | |
| Manual Skip During Crossfade | ⬜ Not Tested | |
| Empty Queue | ⬜ Not Tested | |
| Repeat-One Mode | ⬜ Not Tested | |
| Volume Preservation | ⬜ Not Tested | |
| Shuffle Mode | ⬜ Not Tested | |
| Rapid Track Changes | ⬜ Not Tested | |
| Crossfade Toggle Mid-Track | ⬜ Not Tested | |
| Console Errors | ⬜ Not Tested | |

---

## Notes

- Test results should be filled in manually by developer/QA
- Mark status as: ✅ Pass, ❌ Fail, ⚠️ Partial
- Add notes for any failures or unexpected behavior
- Report bugs with reproduction steps