# Combine Image JS

A web application for combining user avatars with decorative frames.

## Features

- Upload and preview user avatars
- Select from a variety of decorative frames
- Combine avatars with frames
- Download the combined image

## Frame System

The application supports two types of frames:

1. **Remote frames**: Frames hosted on external servers (e.g., Imgur)
2. **Local frames**: Frames stored in the project's assets directory

### Adding Custom Frames

To add custom frames to the application:

1. Add your frame image files (PNG format recommended) to the `public/assets/frames/` directory
2. Update the `public/assets/frames/frames.json` file to include your new frames

For detailed instructions, see the [Frame Assets README](public/assets/frames/README.md).

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```
