# Render Validation Sample & TUI

This project is an Android application for validating Filament render behavior on-device, primarily using bundled tests and goldens. It operates via `adb` intents to automate the generation, exporting, and running of test bundles.

## Automated Execution via ADB Intents

You can fully control the validation app directly from your host machine without touching the device screen. The app listens for specific intent extras when launched.

**General Command Structure:**
```bash
adb shell am start -n com.google.android.filament.validation/.MainActivity <extras>
```

### Supported Intent Extras (Booleans)
- `--ez auto_run true`: Immediately runs the loaded or default test upon startup.
- `--ez generate_goldens true`: Forces the app to generate new golden reference images for the current test instead of comparing against existing ones.
- `--ez auto_export true`: Automatically packages the generated tests/goldens into a `.zip` archive (`Default_Test_<timestamp>.zip`) to the app's files directory when finished.
- `--ez auto_export_results true`: Automatically packages the comparison results and diff images into a `.zip` archive (`results_<timestamp>.zip`) to the app's files directory when finished.

### Supported Intent Extras (Strings)
- `--es zip_path <filename.zip>`: Loads a specific test `.zip` bundle.
  - If you pass an absolute path, it loads from there.
  - If you pass just a filename (e.g. `Default_Test_123.zip`), it intelligently searches the app's external files directory (`/sdcard/Android/data/.../files`) to find it.

### Example ADB Workflows
**Generate new goldens and export them as a test bundle:**
```bash
adb shell am start -n com.google.android.filament.validation/.MainActivity \
  --ez auto_run true \
  --ez generate_goldens true \
  --ez auto_export true
```

**Run an existing specific test bundle and export the results:**
```bash
adb shell am start -n com.google.android.filament.validation/.MainActivity \
  --es zip_path "Default_Test_123.zip" \
  --ez auto_run true \
  --ez auto_export_results true
```

### Manual File Management via ADB
Depending on the Android version and device storage policy, the app's file location resides either on standard External Storage or strictly within inside its Internal Sandbox.

**App's External Storage (Default for most devices):**
- **Push a test bundle to device:** `adb push <filename.zip> /sdcard/Android/data/com.google.android.filament.validation/files/`
- **Pull a test bundle from device:** `adb pull /sdcard/Android/data/com.google.android.filament.validation/files/<filename.zip> .`
- **Pull a result bundle from device:** `adb pull /sdcard/Android/data/com.google.android.filament.validation/files/results_<timestamp>.zip .`

**App's Internal Storage (If external is unavailable):**
*Note: Due to security restrictions, you must use `run-as` to pipe data into/out of the application's secure sandbox.*
- **Push a test bundle to device:**
  1. `adb push <filename.zip> /sdcard/Download/`
  2. `adb shell "run-as com.google.android.filament.validation cp /sdcard/Download/<filename.zip> files/"`
- **Pull a test or result bundle from device:**
  `adb shell "run-as com.google.android.filament.validation cat files/<filename.zip>" > <filename.zip>`

---

## Render Validation Results Viewer

The project includes a static web viewer to visualize and compare test results across different devices. The viewer supports high-resolution image comparison with zoom/pan controls and dynamic diffing.

### Setup & Requirements
The results processor requires `numpy` and `Pillow`. These are not included in the main `requirements.txt` to keep the TUI dependencies minimal.

1. Install processing dependencies:
   ```bash
   pip install numpy Pillow
   ```

### 1. Process Result Bundles
The `process_results.py` script takes a directory of `.zip` result files (exported from the Android app) and generates a static web folder.

```bash
# Usage: python process_results.py <input_zip_dir> <output_web_dir>
python process_results.py ./my_results ./web_output
```

This script:
- Extracts images and metadata from the result zips.
- Generates thumbnails for efficient browser performance.
- Packages the exact tolerance configurations for the web viewer.

### 2. View Results
Because the viewer uses ES modules and fetches data, it must be served via a web server.

```bash
cd ./web_output
python3 -m http.server 1234
```

Navigate to `http://localhost:1234` in your desktop browser.

### Web Viewer Features
- **Tabular Overview**: Compare results across multiple devices and test runs in a single grid.
- **High-Res Viewer**: Click any thumbnail to open a full-size modal.
  - **Zoom & Pan**: Use the mouse wheel to zoom and left-click-drag to pan around the render.
  - **Comparison Modes**: Cycle between "Rendered", "Golden", and "Diff" views.
- **Dynamic JS Diffing**: The `imagediff` algorithm (including `shiftRadius`, `blurRadius`, and complex tolerance trees) is implemented in JavaScript and computed on-the-fly.
- **Fail Highlighting**: Toggle "Highlight Failing Pixels" in the Diff view to see exactly which pixels exceeded the tolerance threshold in pure red.
- **Contrast Control**: Use the contrast slider to amplify subtle rendering differences.

