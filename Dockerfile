FROM nginx:1.27-alpine

# Copy the static app into Nginx's default public folder.
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js

# The container serves the notepad on port 80.
EXPOSE 80
