# Nginx IP Forwarding Configuration

To enable proper geolocation capture for subscribers, add these headers to your Nginx proxy configuration:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # IMPORTANT: These headers forward the real client IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Why This Matters

Without these headers, the Node.js server only sees the local proxy IP (127.0.0.1), not the actual visitor's IP. The `ip-api.com` service cannot geolocate local IPs, so country/city data will be null.

## After Updating

1. Edit your Nginx configuration file (usually `/etc/nginx/sites-available/test.heiraza.com`)
2. Add the proxy headers shown above
3. Test configuration: `sudo nginx -t`
4. Reload Nginx: `sudo systemctl reload nginx`
