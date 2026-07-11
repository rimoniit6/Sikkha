#!/bin/bash
# Keep-alive dev server wrapper
cd /home/z/my-project
rm -rf .next

# Start the actual dev server
./node_modules/.bin/next dev --turbopack -p 3000 &
NEXT_PID=$!
echo "Next.js started with PID $NEXT_PID"

# Keep this script running to maintain the process group
while kill -0 $NEXT_PID 2>/dev/null; do
  sleep 5
done
echo "Dev server exited"