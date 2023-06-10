FROM node:18.16 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


RUN npm run build

FROM node:18.16-alpine

WORKDIR /app

COPY --from=builder /app .

ENV PORT=3000

EXPOSE $PORT

# Run the app
CMD [ "node", "dist/main" ]
