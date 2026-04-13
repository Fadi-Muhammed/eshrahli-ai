# PPTX to PDF Converter (Render Docker Service)

Production-ready Node.js + Express service that converts uploaded `.pptx` files to `.pdf` using LibreOffice in headless mode.

## Endpoints

- `GET /health` -> `{ "ok": true }`
- `POST /convert` -> `multipart/form-data` with one file field named `file`

## Runtime behavior

- Accepts only `.pptx` files.
- Validates both filename extension and mime type.
- Saves uploads to `/tmp/uploads`.
- Saves outputs to `/tmp/outputs`.
- Runs `soffice --headless --convert-to pdf --outdir ...`.
- Returns the generated PDF as downloadable attachment.
- Cleans up temp files in success and failure paths.
- Enforces request file size limit (50 MB).
- Uses safe process invocation (`execFile`, no shell string interpolation).

## Local run

```bash
npm install
npm start
```

Default URL: `http://localhost:8787`

Health check:

```bash
curl http://localhost:8787/health
```

Convert test:

```bash
curl -X POST http://localhost:8787/convert \
  -F "file=@/absolute/path/to/deck.pptx" \
  --output converted.pdf
```

## Docker (local)

```bash
docker build -t pptx-converter .
docker run --rm -p 8787:10000 -e PORT=10000 pptx-converter
```

Then test:

```bash
curl http://localhost:8787/health
```

## Deploy on Render (Docker Web Service)

1. Push this `converter/` folder to your Git repo.
2. In Render: **New + -> Web Service**.
3. Select your repo.
4. Configure:
   - **Environment**: `Docker`
   - **Root Directory**: `converter`
   - **Docker Command / Start Command**: leave empty (Dockerfile handles it)
5. Add env vars if needed:
   - `PORT=10000` (Render usually sets this automatically)
   - `LIBREOFFICE_BIN=soffice` (optional override)
6. Deploy.

Render will build the Docker image and run `npm start` from the container automatically.

## App integration

Set your frontend env value to the deployed converter endpoint:

```bash
VITE_PPTX_CONVERTER_URL=https://your-render-service.onrender.com/convert
```

If you use a backend proxy (recommended for production), point frontend to proxy route instead.
