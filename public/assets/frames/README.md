# Frame Assets

This directory contains frame images used in the application.

## Frame Types

The application supports two types of frames:

1. **Remote frames**: Frames hosted on external servers (URLs)
2. **Local frames**: Frames stored in this directory

## frames.json Structure

The `frames.json` file contains both categories and frames data in the following structure:

```json
{
  "categories": [
    { "id": "category-id", "name": "Category Display Name" },
    ...
  ],
  "frames": [
    {
      "id": "frame-id",
      "name": "Frame Name",
      "thumbnail": "path-or-url",
      "src": "path-or-url",
      "category": "category-id"
    },
    ...
  ]
}
```

## Adding New Categories

To add a new category:

1. Edit the `frames.json` file
2. Add a new object to the `categories` array with:
   - `id`: A unique identifier for the category (used for filtering)
   - `name`: The display name shown to users

## Adding New Frames

To add new frames to the application:

1. For local frames: Add your frame image files (PNG format recommended) to this directory
2. For remote frames: Have the URL ready for the image
3. Update the `frames.json` file to include your new frames in the `frames` array

### Frame Image Requirements

- Use transparent PNG format for best results
- Recommended size: 1000x1000 pixels or larger
- Keep file size reasonable (under 500KB if possible)
- Use a transparent background for the inner area where the user's image will appear

### Frame Object Structure

Each frame in the `frames` array should have the following structure:

```json
{
  "id": "unique-frame-id",
  "name": "Display Name for Frame",
  "thumbnail": "filename.png or https://example.com/image.png",
  "src": "filename.png or https://example.com/image.png",
  "category": "category-id"
}
```

Where:
- `id`: A unique identifier for the frame
- `name`: The display name shown to users
- `thumbnail`: The filename or URL of the thumbnail image (can be the same as src)
- `src`: The filename or URL of the full-size frame image
- `category`: One of the category IDs defined in the categories array

For local frames, just provide the filename (e.g., "christmas.png").
For remote frames, provide the full URL (e.g., "https://example.com/frame.png").

## Available Categories

- `holidays`: Holiday-themed frames (Christmas, New Year, etc.)
- `business`: Professional and corporate frames
- `social`: Social media-oriented frames
- `personal`: Personal use frames (birthday, etc.)
- `events`: Event-specific frames (wedding, graduation, etc.)
- `decorative`: Decorative and artistic frames
