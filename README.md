# FrameX2

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

## Development Setup

To set up the project for development, follow these steps:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FrameX2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start the application on a local development server. You can access it by navigating to `http://localhost:3000` in your web browser.

## Building for Production

To build the application for production, use the following command:

```bash
npm run build
```

To preview the production build locally, run:

```bash
npm run preview
```

## Author

Created by [Author Name].
