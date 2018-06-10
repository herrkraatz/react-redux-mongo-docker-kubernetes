# Pulls Node image based on Linux Alpine from docker hub (hub.docker.com)
FROM node:9.11.1-alpine
MAINTAINER yourself

# Prepares express directory where will run our express server serving as our node-api
RUN mkdir /express
WORKDIR /express

# Installs dependencies
ADD package.json /express/
RUN npm install

# Bundles express app source
ADD . /express/

# Starts the express app
CMD [ "npm", "start" ]