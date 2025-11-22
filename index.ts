import { join } from 'path';
import { networkInterfaces } from 'os';

const STATIC_PATH = join(import.meta.dir, 'src');
const PORT = 3000;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".json": "application/json",
} as const;

function getHotspotAddresses() {
  const interfaces = networkInterfaces();
  const addresses = [];

  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    if (interfaceInfo) {
      for (const info of interfaceInfo) {
        if (info.family === 'IPv4' && !info.internal) {
          addresses.push(`http://${info.address}:${PORT}`);
        }
      }
    }
  }
  
  return addresses;
}

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    if (filePath === "/") {
      filePath = "/index.html";
    }

    const fullPath = join(STATIC_PATH, ...filePath.split('/').filter(Boolean));
    
    try {
      const file = Bun.file(fullPath);
      
      if (await file.exists()) {
        const ext = fullPath.slice(fullPath.lastIndexOf('.'));
        const contentType = MIME_TYPES[ext as keyof typeof MIME_TYPES] || "text/plain";
        
        return new Response(file, {
          headers: { 
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*"
          },
        });
      }

      return new Response("File not found", { status: 404 });
    } catch (error) {
      return new Response("Server error", { status: 500 });
    }
  },
});

console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
console.log(`📁 Serving files from: ${STATIC_PATH}`);

const hotspotAddresses = getHotspotAddresses();
if (hotspotAddresses.length > 0) {
  console.log(`📡 Available on your hotspot network at:`);
  hotspotAddresses.forEach(address => {
    console.log(`   ${address}`);
  });
} else {
  console.log(`❌ No network interfaces found for hotspot access`);
}