# (React/Redux App + Node Server + MongoDB) => Docker => Kubernetes => AWS

This tutorial shall help containerize your stack (React/Redux App, Node Server, and MongoDB) into Docker containers and deploy it for production via Kubernetes to AWS.

MongoDB: Instead of deploying your own MongoDB instance it is certainly a better approach to use a hosted solution, outside of your Kubernetes cluster running on AWS:
- hosted solutions are usually more secure (e.g. hosting companies provide security patches, bad IP (range) blockings, support)
- hosted solutions usually have a sophisticated Replica Set in operation and offer Sharding

But to show how it generally works, we'll still deploy our own MongoDB instance(s) ourselves.

### Some notes to used Client setup having React version 14.3 (0.14.3):

The version we use is based on Stephen Grider's great ReduxSimpleStarter, still without CRA (Create React Native Starterkit).
In my opinion great to see more of React under the hood if we get it running ourselves. And to see how Webpack and Babel work.

But time goes on, and Stephen Grider recently changed his setup to use CRA, which you can find here:

https://github.com/StephenGrider/AdvancedReduxCode/tree/master/auth

It uses React version 16.3.2, and 
- due to CRA there is no more Webpack and Babel needed: `react-scripts` take over
- due to `react-router-dom`, `react-router` is also no longer needed

Feel free to try out Stephen Griders latest version. It's a great exercise.

We stick to the original version for now. This tutorial is about deploying with Docker and Kubernetes.


## Table of Contents

1. [Getting Started - Testing on your own machine outside of Docker containers](#chapter1)
    1. [Database](#chapter1a)
    2. [Server](#chapter1b)
    3. [Client](#chapter1c)
    4. [Testing](#chapter1d)
2. [Docker containers](#chapter2)
    1. [Create images](#chapter2a)
        1. [Database image](#chapter2a1)
        2. [Server image](#chapter2a2)
        3. [Client image](#chapter2a3)
    2. [Run containers](#chapter2b)
        1. [Database container](#chapter2b1)
        2. [Server container](#chapter2b2)
        3. [Client container](#chapter2b3)
        4. [Testing](#chapter2b4)
        5. [Running single containers with `docker container start / stop`](#chapter2b5)
        6. [Running a composition with `docker-compose up`](#chapter2b6)
        7. [Testing the composition](#chapter2b7)
        8. [Shutdown the composition](#chapter2b8)
        9. [How To: An image has to be re-built](#chapter2b9)
3. [Kubernetes - Deploy to AWS](#chapter3)
    1. [Minikube first (`minikube` engine, `kubectl` cli)](#chapter3a)
        1. [Database deployment](#chapter3a1)
        2. [Server deployment](#chapter3a2)
        3. [Client deployment](#chapter3a3)
        4. [Testing the cluster](#chapter3a4)
        5. [Scaling the cluster up](#chapter3a5)
        6. [How To: Deployment A depends on Deployment B](#chapter3a6)
        7. [How To: Debugging / Monitoring](#chapter3a7)
        8. [How To: An image has to be re-built and re-deployed](#chapter3a8)
        9. [Clean up / Teardown / Undeployment](#chapter3a9)
    2. [Then AWS](#chapter3b)
        1. [Architecture](#chapter3b1)
        2. [Deployment Steps](#chapter3b2)
        3. [Important ! Cleanup !](#chapter3b3)
4. [Important last Todo's](#chapter4)
5. [Links](#chapter5)


## <a id="chapter1"></a>1. Getting Started - Testing on your own machine outside of Docker containers

*Notes:*

- If you want to skip this step of testing outside of Docker containers first, just make sure Docker is installed on your machine. Then clone this repo to your preferred project file and jump to chapter 2.
- If you run a Linux or Windows system, please dive into the documentation for commands other than on a Mac. Should successfully run like on a Mac, except for Windows machines running deployments via kops (see below, chapter 3). Windows users must run kops in a container (no native installation yet).

### My Setup

This tutorial was created using

- Mac OS X version High Sierra, 10.13.4 (`sw_vers`) 
- Docker version 18.03.1-ce (`docker -v`)
- Node.js version v9.11.1 (`node -v`)
- MongoDB (`mongod –version`) - differences of versions had NO impact
  - local install: db version v3.2.8
  - Docker container + Kubernetes minikube pod: db version v3.6.5
- kubectl (`kubectl version`)
  - Client Version: GitVersion:"v1.10.2" (cli version)
  - Server Version: GitVersion:"v1.10.0" (api version to connect to minikube)
- minikube version v0.27.0 (`minikube version`)
- kops version 1.9.0 (`kops version`) 

### Docker installed ?

If you haven't Docker installed on your machine, please install free Docker Community Edition ([Instructions](https://docs.docker.com/install/)).

This will install Docker Server (the engine) + Docker Client (the cli) on your machine.

After installation was successful, start Docker by doubleclicking on Docker.app (Mac).

### Node.js installed ?

If you haven't Node.js installed on your machine, please install current (latest), NOT LTS version of Node.js ([By download](https://nodejs.org/en/download/), [By package manager](https://nodejs.org/en/download/package-manager/)).

*Note: Our Node Server Dockerfile we use later on will use one of the latest node versions from Docker Hub.*

This will install Node.js (JavaScript engine) on your machine, and allows JavaScript code to execute not only in your browser.
Node.js also ships with npm package manager we will need below.

## <a id="chapter1a"></a>i. Let's begin with the database

If you haven't MongoDB installed on your machine, please install free MongoDB Community Edition ([Instructions](https://docs.mongodb.com/manual/installation/#tutorials)).

When done, open a Terminal window (directory doesn't matter) and run:

```
> mongod
```

The data is stored in this directory: `/data/db` (root directory of your Mac)

## <a id="chapter1b"></a>ii. The Node Server

### Please first clone this repo into your preferred projects directory

Open a 2nd Terminal window and cd into your preferred projects directory, then run:

```
> git clone https://github.com/herrkraatz/react-redux-mongo-docker-kubernetes.git
```

When repo cloned successfully, cd into root/code/server and run `npm install`

```
> cd react-redux-mongo-docker-kubernetes/code/server
> npm install
```

... when done, run:

```
> npm run dev
```

## <a id="chapter1c"></a>iii. The Client React/Redux App

Open a 3rd Terminal window and cd into root/code/client and run `npm install`

```
> cd react-redux-mongo-docker-kubernetes/code/client
> npm install
```

... when done, run:

```
> npm run dev
```

We should ignore the big size of development bundle.js (403 KiB) for now. Even production bundle.js in dist directory is still big (271 KiB), after you have run `npm run build`. 
Two ways out: 
- Lazy loading of files that are NOT needed while very first rendering the application in the browser (keep TTIF, Time To First Bite, definately below 300 ms). Check out https://webpack.js.org/guides/code-splitting/
- Server Side Rendering to first load static HTML & CSS into the browser so the user has something to do for some seconds while, in parallel, the application (React framework & code) is loaded into the browser and, when done, gets hydrated (merged) into the initially loaded (server side rendered) HTML & CSS.

Eventually PREACT (https://preactjs.com/) might be of help (They say: "Fast 3kB alternative to React with the same modern API.")

## <a id="chapter1d"></a>iv. Testing it all in your browser

```
localhost:8080
```

Opening localhost:8080 should show the login screen. You can Sign Up to create a user account.

You can doublecheck inserted user account via free [MongoDB GUI Robo 3T](https://robomongo.org/) (formerly Robomongo): 
- Go to File >> Connect
- Name: "Local + Docker Connection"
- Address: localhost: 27017


## <a id="chapter2"></a>2. Docker containers

## <a id="chapter2a"></a>i. Create images

Docker containers are instantiated Docker images. So let's create the images first.

## <a id="chapter2a1"></a>a. Database: Create MongoDB image

We don't need to create our own MongoDB image so we don't need a Dockerfile for MongoDB. 
We will use the official public image available on Docker Hub (hub.docker.com): https://hub.docker.com/_/mongo/

But still we need to do two things here: 

- First stop MongoDB in Terminal window #1 by hitting `CTRL-C`. We need to free (release) port 27017 for later on.
- In code/server/index.js, please comment-out:
```
mongoose.connect('mongodb://localhost:27017/auth1');
```
... and comment-in:
```
mongoose.connect('mongodb://db:27017/auth1');
```

## <a id="chapter2a2"></a>b. Server: Create Node Server image

First stop Node Server in Terminal window #2 (server directory) by hitting `CTRL-C`

Now let's create our first Docker image. In Terminal window #2, run:

```
> docker image build -t node-api .
```

Check if it worked out, and run:

```
> docker image ls
```

*Be careful! Type `image`, not `images` !*

Should produce something like this:

```
> docker image ls
REPOSITORY                   TAG                 IMAGE ID            CREATED             SIZE
node-api                     latest              98f409d5e77b        5 minutes ago       89.9MB
node                         9.11.1-alpine       9cc7800b3f3c        5 minutes ago       68.4MB
> 
```

You'll see that `node` image was downloaded first and put in our local Docker engine to be eventually re-used later on. The images are ordered from latest to earliest (top to bottom).

### Explaining the Node Server Dockerfile

Pulls Node image based on Linux Alpine (tagged 9.11.1, the latest at the time of writing) from Docker Hub: https://hub.docker.com/_/node/

Why Alpine? 
Alpine describes itself as: Small. Simple. Secure. Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and BusyBox.
Further reading: https://github.com/nodejs/docker-node#nodealpine

```
FROM node:9.11.1-alpine
MAINTAINER [your name]
```

Prepares express directory where our express server will run, serving as our node-api
```
RUN mkdir /express
WORKDIR /express
```

Installs dependencies
```
ADD package.json /express/
RUN npm install
```

Bundles express app source
```
ADD . /express/
```

Starts the express app
```
CMD [ "npm", "start" ]
```
  
## <a id="chapter2a3"></a>c. Client: Create React/Redux App image

First stop React/Redux App in Terminal window #3 (client directory) by hitting `CTRL-C`

Now let's create the build in the `dist` folder. In Terminal window #3, run:

```
> npm run build
```

This will create our bundle.js and copies index.html and the styles directory into the dist directory:

Now we can create our second Docker image. Again, in Terminal window #3, run:

```
> docker image build -t react-nginx .
```

Check if it worked out, and run 

```
> docker image ls
```

Should produce something like this:

```
> docker image ls
REPOSITORY                   TAG                 IMAGE ID            CREATED             SIZE
react-nginx                  latest              5ea4387bca67        4 minutes ago       109MB
...
> 
```

### Explaining the React/Redux App Dockerfile

Pulls latest Nginx image from Docker Hub: https://hub.docker.com/_/nginx/

Why Nginx (pronounced "engine-x")? 
Nginx describes itself as an open source reverse proxy, load balancer, and http cache. 
The nginx project started with a strong focus on high concurrency, high performance and low memory usage.

It will help our express server to handle requests in a more efficient way.

```
FROM nginx
MAINTAINER [your name]
```

Copies the build files into the image
```
COPY dist /usr/share/nginx/html
```

## <a id="chapter2b"></a>ii. Run Docker containers

*Note: A Docker container is just a running instance of a Docker image.*

### `docker container run` vs. `docker container start` vs `docker-compose up`

There are several ways to run a container:

- `docker container run` creates a NEW container out of an image and starts it up (runs it)
- `docker container start` starts up (runs) an EXISTING container
- `docker-compose up` can do both and more: 
  - creates a NEW container out of an image and starts it up
  - starts up an EXISTING container
  - with `--build` flag: re-builds an image and uses the re-built image to create a NEW container and starts it up


### Let's look at `docker container run` first

When our app needs MULTIPLE containers (tiers in our case) running through `docker container run` we need to create our own Docker network first. This way all of our 3 containers will run in the same Docker network and can communicate with each other. 

Run this command in any Terminal window:

```
> docker network create my_app_network
```

To see if it worked out:

```
> docker network ls
  NETWORK ID          NAME                DRIVER              SCOPE
  38f2bac0629f        bridge              bridge              local
  e53123a4f652        host                host                local
  0667992aefc3        my_app_network      bridge              local
  bf6de7cf95ce        none                null                local
```

`bridge` is Docker's default network driver and we need this one.

*Note*
If we don't have our own network, this error will come up when Server container tries to connect to MongoDB container:
```
(node:15) UnhandledPromiseRejectionWarning: MongoNetworkError: failed to connect to server [db:27017] on first connect [MongoNetworkError: getaddrinfo ENOTFOUND db db:27017]
    at Pool.<anonymous> (/express/node_modules/mongodb-core/lib/topologies/server.js:505:11)
```

Now we can go on running all 3 containers in following order.

*Note: The order is important ! We need to start MongoDB first, so that express (or better: mongoose) can connect to it. And react needs to connect to express when Sign In/Sign Up button is pushed.*

## <a id="chapter2b1"></a>a. Database: Run MongoDB container

As we mentioned above, to run a MongoDB container, we just take advantage of MongoDB image `mongo` being available on Docker Hub. 

Open a Terminal window and cd into root/docker directory. We also want to create a persistent storage in this directory
so that - if we re-start the container - the data is NOT lost.

```
> docker container run -v $(pwd)/data/db:/data/db --network my_app_network --name db mongo
```

`-v $(pwd)/data/db:/data/db` (`-v`  means volume, `$(pwd)` means present working directory (the one, we're just in)) mounts directory `root/docker/data/db` to MongoDB's data default directory `/data/db`

`--network my_app_network` lets our MongoDB container run in our own, just created network `my_app_network`

`--name db` gives our MongoDB container a readable name (to be easier stopped/started later on if needed)

`mongo` is the short form for `mongo:latest`. Right after executing `docker container run`, Docker will pull image `mongo:latest` from Docker Hub (hub.docker.com)

*Note:*

If Volume mounting fails, do following check:
Right-click on Docker symbol in the top menu bar of your Mac, choose Preferences, go to File Sharing tab, and make sure that you cloned this repo into one of the listed directories/subdirectories. If not, you can add the repo root directory there.


## <a id="chapter2b2"></a>b. Server: Run Node Server container

Open a Terminal window (directory doesn't matter) and run:

```
> docker container run -p 3090:3090 --network my_app_network --name express node-api
```

`-p 3090:3090` (`-p` means publish) opens port 3090 on host and forwards requests arriving at `host port 3090` to `container port 3090`


## <a id="chapter2b3"></a>c. Client: Run React/Redux App container

```
> docker container run -d -p 8080:80 --network my_app_network --name react react-nginx
```

`-d` (`-d` means detach) lets this container run detached (in the background). Otherwise the Terminal window is full of logs.


## <a id="chapter2b4"></a>d. Testing it all within our 3 single running containers (React/Redux App + Node Server + MongoDB)

Open browser, then open:

```
localhost:8080
```

Opening localhost:8080 should show the login screen again. 
Trying to Sign In with your previously created user account will NOT WORK as our fresh MongoDB instance (container) 
has a Persistent Volume other than our locally installed MongoDB. 
MongoDB starts in this Persistent Volume with an empty database.
So try to Sign Up instead and thereafter try to Sign In with the newly created user account.

Again: You can doublecheck inserted user account via free [MongoDB GUI Robo 3T](https://robomongo.org/).

Connection: Same as above

## <a id="chapter2b5"></a>e. Let's look at `docker container start` and `docker container stop` now

In order to stop a running container, e.g. our client container, just run in any directory:

```
> docker container stop react
```

To stop all three containers:

```
> docker container stop react
> docker container stop express
> docker container stop db
```

To re-start all three containers:

*Note: The order is again important (see above) !*

```
> docker container start db
> docker container start express
> docker container start react
```

## <a id="chapter2b6"></a>f. Finally `docker-compose up`

### Important references:

- `docker-compose` commands: https://docs.docker.com/compose/reference/overview/
- `docker-compose.yml` file: https://docs.docker.com/compose/compose-file/

### Pros of `docker-compose`:

- Instead of MANUALLY creating / running / re-starting Docker containers, there's the great single Docker command `docker-compose up`
- With `docker-compose up` we don't need our own Docker network as above, because ALL services in the `docker-compose.yml` file will be run/deployed as containers in the SAME network automatically

Ok, to try this out, please stop all running containers first (port collisions):

```
> docker container stop react
> docker container stop express
> docker container stop db
```

Here's the `docker-compose.yml` file (under root/docker) which is needed by `docker-compose up` command:

```
version: '3'
services:
    db:
        image: mongo
        ports:
            - "27017:27017"
        volumes:
            - ./data/db:/data/db
    express:
        build:
            context: ../code/server
            dockerfile: Dockerfile
        ports:
            - "3090:3090"
        depends_on:
            - db
            
        # Specifying depends_on: db is not enough, as docker-compose only waits with bringing express container up
        # when db container is up and running, but docker-compose has no clue that express needs MongoDB to have started
        # up completely in the running container as well.
        # So let's use command below to ping and only start our server (npm start) when the database is ready.
        # Having the server Dockerfile already run the CMD [ "npm", "start" ] is not a problem. The command here will 
        # just overrride the CMD in the Dockerfile: https://docs.docker.com/compose/compose-file/#command
        # This way we can still startup the server standalone, without docker-compose.

        # > allows multiple lines in yaml file
        # sh -c allow to run multiple shell commands, one per line
        command: >
              sh -c "
                while ! nc -z db 27017;
                do
                  echo sleeping;
                  sleep 1;
                done;
                echo Connected!;
                npm start;
                "
    react:
        build:
            context: ../code/client
            dockerfile: Dockerfile
        ports:
            - "8080:80"
        depends_on:
            - express

```

Ok, now cd into docker directory and let's finally run it:

```
> docker-compose up
```  

It takes some moments ... when done, let's check what `docker-compose up` created:

Images:

```
> docker image ls
REPOSITORY                   TAG                 IMAGE ID            CREATED             SIZE
docker_react                 latest              2b8aeaf70942        34 minutes ago      109MB
docker_express               latest              4e0c6120048f        35 minutes ago      89.9MB
react-nginx                  latest              58d69cea4ecb        13 hours ago        109MB
node-api                     latest              98f409d5e77b        14 hours ago        89.9MB
node                         9.11.1-alpine       9cc7800b3f3c        14 hours ago        68.4MB
mongo                        latest              f93ff881751f        15 hours ago        368MB
```

It created the 2 images `docker_react` and `docker_express` (the name is created automatically: docker-prefix + service name)

Containers:

```
> docker container ls
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                      NAMES
90185c0ee895        docker_react        "nginx -g 'daemon of…"   About an hour ago   Up 22 seconds       0.0.0.0:8080->80/tcp       docker_react_1
b359cfedded7        docker_express      "npm start"              About an hour ago   Up 22 seconds       0.0.0.0:3090->3090/tcp     docker_express_1
15f363d5a357        mongo               "docker-entrypoint.s…"   About an hour ago   Up 23 seconds       0.0.0.0:27017->27017/tcp   docker_db_1
```

*Note: Only running `docker container ls -a` returns ALL containers, also the exited ones.*

It also created 3 running containers `docker_react_1`, `docker_express_1`, and `docker_db_1` (the name is created automatically: docker-prefix + service name + integer)

Also interesting to see are the port forwardings (see PORTS).

## <a id="chapter2b7"></a>g. Testing it all within our 3 composed running containers (React/Redux App + Node Server + MongoDB).

Open browser, then open:

```
localhost:8080
```

Opening localhost:8080 should show the login screen again. 
Trying to Sign In with your previously created user account WILL work this time:

```
services:
    db:
        image: mongo
        ports:
            - "27017:27017"
        volumes:
            - ./data/db:/data/db
```

`volumes` key points to our previously created database files in docker directory (when we ran `docker container run ...`).          
   
Again: You can doublecheck previously created user account via free [MongoDB GUI Robo 3T](https://robomongo.org/).

Connection: Again same as above

*Notes:*

1. If we initially worked WITHOUT Persistent Volume, and added it later on, we need to remove the MongoDB container first. Otherwise Docker uses the cached version. So run `docker-compose rm db` beforehand.

2. If you don't want a Persistent Volume (no `volumes` key is specified), MongoDB would start with an empty database under the root directory of MongoDB's container: `/data/db` (same as on our Mac). You can search the created anonymous volume like so:

    ```
    > docker volume ls
    DRIVER              VOLUME NAME
    local               0dcfbb3bc47720f4c38a4aa23b093fff0e6d001169bad3882e3143dc6db9ca6d
    local               2494bade97aca45805ad4d7219a38af0ad6b2597fdbf1c0fbf7ecc2d750aadba
    local               27fdb62b186f3b001a36f6bf2d1af41a9dd12eefb481a218cbfbea1592dbf3fc
    local               6e5a141cd8ddfd0b0efc1760fad3ce7c2ee496f878aae6592c0e1c1f0be812c9
    ```

    Inspect it by running `docker volume inspect 0dcfbb3bc47720f4c38a4aa23b093fff0e6d001169bad3882e3143dc6db9ca6d`

    Now, if we again run `docker-compose up`, your MongoDB data is not gone. You will probably get this message pattern, too:
    
    ```
    WARNING: Service "db" is using volume "/data/db" from the previous container. Host mapping "/Users/User1/Desktop/Projects/ReactReduxMongoDockerKubernetes/docker" has no effect
    Recreating docker_db_1 ... done
    ```
    
    So Docker tries to connect the currently running MongoDB container to the previously running (and exited) MongoDB container's anonymous volume. So the data is NOT lost.
    But better mount a Persistent Volume as above.
    
    Further reading: https://stackoverflow.com/questions/36416690/how-to-restore-a-mongo-docker-container-on-the-mac


## <a id="chapter2b8"></a>h. Don't forget: Shut down the composition at the end

Just hit `CTRL-C` in the Terminal window where you ran `docker-compose up`. This will stop and delete the running containers automatically.

If shutdown not possible as one or more containers crashed, you can easily remove the other still running container(s) manually (by `-f`: force):

```
> docker container ls
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                      NAMES
13c01e83f338        docker_react        "nginx -g 'daemon of…"   29 minutes ago      Up 32 seconds       0.0.0.0:8080->80/tcp       docker_react_1
0ac63ea63a7b        docker_express      "npm start"              29 minutes ago      Up 33 seconds       0.0.0.0:3090->3090/tcp     docker_express_1
d1801f43a22d        mongo               "docker-entrypoint.s…"   29 minutes ago      Up 33 seconds       0.0.0.0:27017->27017/tcp   docker_db_1

> docker container rm -f 13c01e83f338 0ac63ea63a7b d1801f43a22d
13c01e83f338
0ac63ea63a7b
d1801f43a22d
> 
```

## <a id="chapter2b9"></a>i. How To: An image has to be re-built

Until now we used `docker-compose up` command. But what if we need to change our code and/or Dockerfile of our image?

The answer: `docker-compose up --build`

Ok, here's how it generally works: The flag `--build` together with `build` key in `docker-compose.yml` file:

```
> docker-compose up --build
```  

```
build:
    context: ../code/server
    dockerfile: Dockerfile
```

*Notes:*

First hit `CTRL-C` in the Terminal window where you ran `docker-compose up` if the composition is still running.

To rebuild a single image (in docker-compose terminology: a service) and start up the composition again we have these 3 options:

- the easiest: 

    ```
    > docker-compose up --build
    ```  
    
    This tries to rebuild ALL images and run the containers.
    
    If `--build` is NOT specified, Docker just re-uses the previously built image and ignores our changes to code/Dockerfile as it uses the cache for faster processing.

- the `docker-compose build` command:

    ```
    > docker-compose build express
    ```
    
    And, when done:
    
    ```
    > docker-compose up
    ```

- do it the old way, WITHOUT `docker-compose`, e.g. after changes in our 

    Server image:
    
    ```
    > cd root/code/server
    > docker image build -t node-api .
    > docker container run -p 3090:3090 --name express node-api
    ```
    
    Client image:
    
    ```
    > cd root/code/client
    > docker image build -t react-nginx .
    > docker container run -d -p 8080:80 --name react react-nginx
    ```

*IMPORTANT for re-building Client image: If you also made changes in the client code (not only in the client Dockerfile), you have to run ...*
 
```
> npm run build
```

*... in directory root/code/client to create a new bundle.js file in the `dist` directory (and also copies index.html and the styles directory into `dist`) BEFORE re-building the image.*

Further reading: https://docs.docker.com/compose/production/#deploying-changes


## <a id="chapter3"></a>3. Kubernetes - Deployment to AWS

Before we start, some definitions of Kubernetes terms first (https://kubernetes.io/docs/concepts/services-networking/ingress/):

- Node: A single virtual or physical machine in a Kubernetes cluster.
- Cluster: A group of nodes firewalled from the internet, that are the primary compute resources managed by Kubernetes.
- Edge router: A router that enforces the firewall policy for your cluster. This could be a gateway managed by a cloud provider or a physical piece of hardware.
- Cluster network: A set of links, logical or physical, that facilitate communication within a cluster according to the Kubernetes networking model. Examples of a Cluster network include Overlays such as flannel or SDNs such as OVS.
- Service: A Kubernetes Service that identifies a set of pods using label selectors. Unless mentioned otherwise, Services are assumed to have virtual IPs only routable within the cluster network.


Have a read first (authors with experience in Kubernetes in production)

- Auto-deployments general: https://techbeacon.com/one-year-using-kubernetes-production-lessons-learned
- Auto-deployments with Weave: https://www.weave.works/technologies/weaveworks-on-aws/
- Best practice I: https://www.weave.works/blog/kubernetes-best-practices
- Best practice II: https://github.com/arschles/kube-best-practices
- Best practice III: https://medium.com/tailor-tech/production-grade-kubernetes-on-aws-4-tools-that-made-our-lives-easier-29438e8b58ca
- With Github Authentication: https://medium.freecodecamp.org/how-i-built-a-kubernetes-cluster-so-my-coworkers-could-deploy-apps-faster-ad5567bf6fa8

Also important: 

- Helm Stable Kubernetes Charts: 
    - The Kubernetes Package Manager makes it possible to install stable Deployments (helm charts) in your cluster: https://github.com/kubernetes/charts/tree/master/stable
    - Here you can spy from pros how to create your own yaml files
    - Install a deployment on Minikube (and later in the cloud service) with just this command: `helm install ...`
    - install free helm cli and tiller engine (server): https://docs.helm.sh/using_helm/#installing-helm

## <a id="chapter3a"></a>i. First step: Make it all work locally on your machine - with Minikube (the engine) and kubectl (the cli)

Before we deploy to ASW I highly recommend to use Kubernetes' Minikube engine to deploy the containers on your local machine first. This way you get a feeling of Kubernetes commands which is useful because AWS will charge regardless if you're a beginner or professional.

Other (online) playgrounds:
- Katacoda: https://www.katacoda.com/courses/kubernetes/playground
- Play with Kubernetes: https://labs.play-with-k8s.com/

### Basic Setup:

#### First install hypervisor Virtual Box

If you haven't Virtual Box installed on your machine, please install free Virtual Box ([Instructions](https://www.virtualbox.org/wiki/Downloads)).

Other hypervisors may be possible. Check out https://github.com/kubernetes/minikube because we need a hypervisor for Minikube.

#### Next install the kubectl cli

If you haven't kubectl installed on your machine, please install free kubectl cli ([Instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/)).

With kubectl you will be able to connect to your local Minikube engine, and, later on, also to your Kubernetes cluster(s) running on ASW (or on another cloud, or on your own solution).

#### Last install the Minikube engine

If you haven't Minikube installed on your machine, please install free Minikube engine ([Instructions](https://github.com/kubernetes/minikube/releases)).

With Minikube you will be able to run and test local deployments first, before deploying on AWS (or on another cloud, or on your own solution).

Start Minikube !


### Important minikube commands

Open a Terminal window, then run:

```
> minikube start
```

To stop Minikube later on, run:

```
> minikube stop
```

For Minikube's IP address (our single node engine), run:

```
> minikube ip
```

For Minikube's dashboard which opens a nice GUI in your browser, run:

```
> minikube dashboard
```

### Important kubectl commands

Similar to Docker's `docker-compose.yml` file Kubernetes "came up" with `deployment.yml` file to create running containers out of our images.
Kubernetes starts a container within a Pod, and Pods can have multiple containers. Multiple containers within a single Pod can make sense if containers are tightly coupled and depend on each other, which means that they all shall be running or none.

Not only running container(s) can get created out of a `deployment.yml` file, but also Services (Load Balancers, Port Publishing), and Persistent Volumes.

The command to deploy and automatically run a Pod, a Service, or a Volume, is:

```
> kubectl apply -f deployment.yml
```

`-f` means: Use filename `deployment.yml`

To check if Pods and Services are up:

```
> kubectl get all
```

Funny, but `kubectl get all` does NOT return ALL ! To check Persistent Volumes:

```
> kubectl get persistentvolumes
```

You can also run the shorter form `kubectl get pv`

The only way to stop a Deployment, Service, or Volume is to delete it. Don't worry. With `kubectl apply -f deployment.yml` you can easily run it again.

E.g. stopping (deleting) the express-deployment, you need the exact name of it: You find it in the `express-deployment.yml` file:

```
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: express-deployment
...
```
Now you can stop (delete) the express-deployment:

```
> kubectl delete deployment express-deployment
```

After this little crash-course, this is now our goal: Make our 3-tier application (react/express/mongo) get started in a cluster (!) with only these 3 commands:

```
> kubectl apply -f db-deployment.yml
> kubectl apply -f express-deployment.yml
> kubectl apply -f react-deployment.yml
```

Ok, let's get started ...

## <a id="chapter3a1"></a>a. Database: MongoDB deployment

To provide redundancy and high availability, we want to deploy a MongoDB as Replica Set that has 3 members:

- A primary member (there may be only ONE)
    - that receives ALL write operations 
    - that is the Client MongoDB driver's default member for read operations
- Two secondary members 
    - that replicate all operations from the primary in order to keep an identical data set
    - that receive read operations if the primary is too busy

Further reading: https://docs.mongodb.com/manual/core/replica-set-members/

How will it look in our Kubernetes cluster (Minikube and later on AWS)?

Each Replica Set member will run in its own Pod that contains
- one container with a running instance of a MongoDB image and mongod process
- its own Persistent Volume (storage)

*Redundancy:*

- Data Replication is done by Replica Set members themselves.
- If one Pod will crash, Kubernetes will try to restart the Pod, and in the meantime the other 2 Pods still serve and the application is still working.
- Replica Set uses elections if primary member becomes unavailable - to determine which member will be the new primary. Also adding a new member and other events cause an election: https://docs.mongodb.com/manual/core/replica-set-elections/

    
*High Availability:*

- The Client MongoDB driver will take care of Load Balancing.
    - For read operations it checks Replica Set primary member first, and if too busy, tries to read from the secondary members.
    - For write operations there is no 'Load Balancing', as write operations are only allowed through the primary member.
- The Client MongoDB driver will connect to ALL Replica Set members through our headless Service. The driver will know which is the primary member, and which are the secondary members.


### Extra: Disaster Recovery, Reporting, and Backup

You can also setup an extra secondary member (not reachable by any Client MongoDB driver) for the purpose of
- fast disaster recovery
- reporting of live data without affecting general performance of the application
- backup without affecting general performance of the application

### Let's first look into deployment file `db-deployment.yml` 

*The deployment file consists of 2 parts:*

1. Service deployment

    ```
    apiVersion: v1
    kind: Service
    metadata:
      name: mongodb-service
    ```
    
    The Service `name: mongodb-service` is our exposed end-point to which our Server deployment (express node-api) will connect to when its Client MongoDB driver mongoose executes: 
    `mongoose.connect('mongodb://auth1_readWrite:12345@mongodb-service:27017/auth1?replicaSet=MainRepSet');` (see later).
    
    The Service acts as headless Service which means that NO single IP is created to do Load Balancing: `clusterIP: None`.
    Load Balancing is done via Client MongoDB driver and the Replica Set.
    The headless Service just enables a connection between the Client MongoDB driver and ALL of the 3 members in the Replica Set (see StatefulSet directly below: our 3 MongoDB Pods) 
    at the same time by returning the members' static DNS names back to the Client MongoDB driver (the 3 members of the Replica Set all get 3 unique DNS names through MongoDB initialization - 
    see `02-init_MongoDB_Replicas_And_Admin.sh` below).
    
    Again: Our express node-api "client" is connected to ALL 3 MongoDB Pods at the same time.

2. StatefulSet deployment
    
    ```
    apiVersion: apps/v1
    kind: StatefulSet
    metadata:
      name: mongod
    ```
    
    The StatefulSet `name: mongod` will create 3 Pods (running instances) ...
    
    ```
    replicas: 3
    ```
    
    ... out of the latest mongo image out there on Docker Hub (as above: https://hub.docker.com/r/_/mongo/): 
    
    ```
    containers:
      - name: mongod-container
        image: mongo
    ```
    
    How is the StatefulSet linked to the Service ? It is done via the selector key ...
    
    StatefulSet:
    
    ```
    template:
        metadata:
          labels:
            role: mongo
    ```
    
    Service:
    
    ```
    selector:
        role: mongo
    ```
    
    A database also needs a Persistent Volume (storage). We have a Persistent Volume Claim `name: mongodb-persistent-storage-claim` that will create a 500 MB storage for EACH Pod `storage: 500Mi`:
    
    ```
    volumeClaimTemplates:
      - metadata:
          name: mongodb-persistent-storage-claim
    ```
    
    We just need to specify a Claim for that. Kubernetes will take care of allocating space and creating the Persistent Volume(s) for us automatically.
    
    Finally we need to link our MongoDB `template` to the `VolumeClaimTemplate`:
    
    ```
    volumeMounts:
      - name: mongodb-persistent-storage-claim
        mountPath: /data/db
    ```
    
    MongoDB's default database storage file path `/data/db` will be mounted to this Persistent Volume Claim. 
    
    Again: Kubernetes will take care of creating a Persistent Volume (Storage) out of our Persistent Volume Claim automatically.


### Let's run our deployment script `01-deploy_MongoDB.sh` 

Open a Terminal window, cd into root/kubernetes/minikube directory, and run:

```
> sh 01-deploy_MongoDB.sh
```

*The script will do two things:*

1. Creates a secret key file to access the MongoDB cluster from your Minikube engine only (later from your Kubernetes engine in the cloud only).

    The reason: A Username/Password combinations or Tokens MUST NOT be placed inside a `deployment.yml` file !
    The `deployment.yml` file will usually be shared across your development team or the internet.
    
    Our secret will instead be loaded/injected AT RUNTIME as BASE64 encoded string (key:value pairs, called a map or hash table) either
    
    - into a file placed into the volume to be accessed by the Pod
    - as environment variable to be accessed by the Pod
    
    In our case the generated secret will be stored in file `internal-auth-mongodb-keyfile` within the Minikube engine.

2. Creates our headless Service and our StatefulSet by just executing the one-liner `kubectl apply -f db-deployment.yml`

    This should come out:
    
    ```
    > sh 01-deploy_MongoDB.sh
    secret "shared-bootstrap-data" created
    service "mongodb-service" created
    statefulset.apps "mongod" created
    NAME                                      READY     STATUS              RESTARTS   AGE
    pod/mongod-0                              0/1       ContainerCreating   0          5s
    
    NAME                           TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
    service/mongodb-service        ClusterIP      None             <none>        27017/TCP        5s
    
    NAME                      DESIRED   CURRENT   AGE
    statefulset.apps/mongod   3         1         5s
    ```
    
    Running `kubectl get all` some moments later should give this result:
    
    ```
    < kubectl get all
    NAME                                      READY     STATUS              RESTARTS   AGE
    pod/mongod-0                              1/1       Running             2          1d
    pod/mongod-1                              1/1       Running             2          1d
    pod/mongod-2                              1/1       Running             2          1d
    
    NAME                           TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
    service/mongodb-service        ClusterIP      None             <none>        27017/TCP         1d
    
    NAME                      DESIRED   CURRENT   AGE
    statefulset.apps/mongod   3         3         1d
    ```
    
    It shows 3 runnings MongoDB - Pods, our headless Service, and our StatefulSet wanting to have 3 replicas (Pods) running.
    
    Again, `kubectl get all` does NOT return ALL ! To list Secrets and Volumes, run:
    
    ```
    > kubectl get secrets
    NAME                    TYPE                                  DATA      AGE
    default-token-wtx9j     kubernetes.io/service-account-token   3         15d
    shared-bootstrap-data   Opaque                                1         1d
    
    > kubectl get persistentvolumeclaims
    NAME                                        STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
    mongodb-persistent-storage-claim-mongod-0   Bound     pvc-967012ae-64ba-11e8-990d-08002714a68e   1Gi        RWO            standard       1d
    mongodb-persistent-storage-claim-mongod-1   Bound     pvc-e617b029-64ba-11e8-990d-08002714a68e   1Gi        RWO            standard       1d
    mongodb-persistent-storage-claim-mongod-2   Bound     pvc-eba3b239-64ba-11e8-990d-08002714a68e   1Gi        RWO            standard       1d
    
    > kubectl get persistentvolumes
    NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM                                               STORAGECLASS   REASON    AGE
    pvc-967012ae-64ba-11e8-990d-08002714a68e   1Gi        RWO            Delete           Bound     default/mongodb-persistent-storage-claim-mongod-0   standard                 1d
    pvc-e617b029-64ba-11e8-990d-08002714a68e   1Gi        RWO            Delete           Bound     default/mongodb-persistent-storage-claim-mongod-1   standard                 1d
    pvc-eba3b239-64ba-11e8-990d-08002714a68e   1Gi        RWO            Delete           Bound     default/mongodb-persistent-storage-claim-mongod-2   standard                 1d
    ```
    
    To shorten it, you can also run `kubectl get pvc` (persistentvolumeclaims) and `kubectl get pv` (persistentvolumes).
    
    In order to dive deeper into Pods, Volumes, etc., run the describe command:
    
    ```
    > kubectl describe pv pvc-967012ae-64ba-11e8-990d-08002714a68e
    Name:            pvc-967012ae-64ba-11e8-990d-08002714a68e
    Labels:          <none>
    Annotations:     hostPathProvisionerIdentity=c4d471a3-64ba-11e8-8adf-08002714a68e
                     pv.kubernetes.io/provisioned-by=k8s.io/minikube-hostpath
    Finalizers:      [kubernetes.io/pv-protection]
    StorageClass:    standard
    Status:          Bound
    Claim:           default/mongodb-persistent-storage-claim-mongod-0
    Reclaim Policy:  Delete
    Access Modes:    RWO
    Capacity:        1Gi
    Node Affinity:   <none>
    Message:         
    Source:
        Type:          HostPath (bare host directory volume)
        Path:          /tmp/hostpath-provisioner/pvc-967012ae-64ba-11e8-990d-08002714a68e
        HostPathType:  
    Events:            <none>
    ```

### Let's run our init script `02-init_MongoDB_Replicas_And_Admin.sh` 

So our next script to run:

```
> sh 02-init_MongoDB_Replicas_And_Admin.sh Pabc123!
```

*The script will again do two things:*

1. Initializes the MongoDB Replica Set

    On the first MongoDB Pod `mongod-0` we open a Mongo Shell and execute a command to initiate a Replica Set providing 3 static DNS names `mongod-0.mongodb-service.default.svc.cluster.local:27017`, `mongod-1.mongodb-service.default.svc.cluster.local:27017`, `mongod-2.mongodb-service.default.svc.cluster.local:27017`
    
    We need to run rs.initiate() on only ONE instance (Pod):
    
    "Run rs.initiate() on just one and only one mongod instance for the replica set." - see https://docs.mongodb.com/manual/reference/method/rs.initiate/)


2. Creates MongoDB admin user

    Again, on the first MongoDB Pod `mongod-0` we open a Mongo Shell and create our admin user `main_admin` using password `Pabc123!`, having root rights on admin database.
    
    *Note: Of course choose your own password if you like.*
    
    This should come out:
    
    ```
    > sh 02-init_MongoDB_Replicas_And_Admin.sh Pabc123!
    Configuring the MongoDB Replica Set
    MongoDB shell version v3.6.5
    connecting to: mongodb://127.0.0.1:27017
    MongoDB server version: 3.6.5
    { "ok" : 1 }
    Waiting for the Replica Set to initialise...
    MongoDB shell version v3.6.5
    connecting to: mongodb://127.0.0.1:27017
    MongoDB server version: 3.6.5
    {
            "set" : "MainRepSet",
            "date" : ISODate("2018-05-31T07:49:11.730Z"),
            "myState" : 1,
            "term" : NumberLong(1),
            "heartbeatIntervalMillis" : NumberLong(2000),
            "optimes" : {
                    "lastCommittedOpTime" : {
                            "ts" : Timestamp(1527752933, 1),
                            "t" : NumberLong(1)
                    },
                    "readConcernMajorityOpTime" : {
                            "ts" : Timestamp(1527752933, 1),
                            "t" : NumberLong(1)
                    },
                    "appliedOpTime" : {
                            "ts" : Timestamp(1527752933, 1),
                            "t" : NumberLong(1)
                    },
                    "durableOpTime" : {
                            "ts" : Timestamp(1527752933, 1),
                            "t" : NumberLong(1)
                    }
            },
            "members" : [
                    {
                            "_id" : 0,
                            "name" : "mongod-0.mongodb-service.default.svc.cluster.local:27017",
                            "health" : 1,
                            "state" : 1,
                            "stateStr" : "PRIMARY",
                            "uptime" : 464,
                            "optime" : {
                                    "ts" : Timestamp(1527752933, 1),
                                    "t" : NumberLong(1)
                            },
                            "optimeDate" : ISODate("2018-05-31T07:48:53Z"),
                            "infoMessage" : "could not find member to sync from",
                            "electionTime" : Timestamp(1527752930, 1),
                            "electionDate" : ISODate("2018-05-31T07:48:50Z"),
                            "configVersion" : 1,
                            "self" : true
                    },
                    {
                            "_id" : 1,
                            "name" : "mongod-1.mongodb-service.default.svc.cluster.local:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 31,
                            "optime" : {
                                    "ts" : Timestamp(1527752933, 1),
                                    "t" : NumberLong(1)
                            },
                            "optimeDurable" : {
                                    "ts" : Timestamp(1527752933, 1),
                                    "t" : NumberLong(1)
                            },
                            "optimeDate" : ISODate("2018-05-31T07:48:53Z"),
                            "optimeDurableDate" : ISODate("2018-05-31T07:48:53Z"),
                            "lastHeartbeat" : ISODate("2018-05-31T07:49:10.280Z"),
                            "lastHeartbeatRecv" : ISODate("2018-05-31T07:49:11.264Z"),
                            "pingMs" : NumberLong(0),
                            "syncingTo" : "mongod-0.mongodb-service.default.svc.cluster.local:27017",
                            "configVersion" : 1
                    },
                    {
                            "_id" : 2,
                            "name" : "mongod-2.mongodb-service.default.svc.cluster.local:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 31,
                            "optime" : {
                                    "ts" : Timestamp(1527752933, 1),
                                    "t" : NumberLong(1)
                            },
                            "optimeDurable" : {
                                    "ts" : Timestamp(1527752933, 1),
                                    "t" : NumberLong(1)
                            },
                            "optimeDate" : ISODate("2018-05-31T07:48:53Z"),
                            "optimeDurableDate" : ISODate("2018-05-31T07:48:53Z"),
                            "lastHeartbeat" : ISODate("2018-05-31T07:49:10.297Z"),
                            "lastHeartbeatRecv" : ISODate("2018-05-31T07:49:11.264Z"),
                            "pingMs" : NumberLong(0),
                            "syncingTo" : "mongod-0.mongodb-service.default.svc.cluster.local:27017",
                            "configVersion" : 1
                    }
            ],
            "ok" : 1,
            "operationTime" : Timestamp(1527752933, 1),
            "$clusterTime" : {
                    "clusterTime" : Timestamp(1527752933, 1),
                    "signature" : {
                            "hash" : BinData(0,"PmoktmmCrYIJpJAWdIbOn1NS6LY="),
                            "keyId" : NumberLong("6561648875013144577")
                    }
            }
    }
    Creating user: 'main_admin'
    MongoDB shell version v3.6.5
    connecting to: mongodb://127.0.0.1:27017
    MongoDB server version: 3.6.5
    Successfully added user: {
            "user" : "main_admin",
            "roles" : [
                    {
                            "role" : "root",
                            "db" : "admin"
                    }
            ]
    }
    ```

### Last steps:

1. We create a power user (read-write rights on auth1 database only) which connects to auth1 database. We shouldn't connect with main admin.

    Open a Terminal window and run:
    
    ```
    > kubectl exec -it mongod-0 -c mongod-container bash
    ```
    
    `-it` (`-i` means interactive, `-t` means "Allocate a pseudo-TTY") both are needed for the `bash` to work
    
    `bash` opens a bash INSIDE mongod-0
    
    `-c` (`-c` means container)
    
    In the bash we tell mongo to connect to the Replica Set:
    
    ```
    root@mongod-0:/# mongo mongodb://mongodb-service:27017/?replicaSet=MainRepSet
    ```
    
    Result:
    
    ```
    root@mongod-0:/# mongo mongodb://mongodb-service:27017/?replicaSet=MainRepSet
    MongoDB shell version v3.6.5
    connecting to: mongodb://mongodb-service:27017/?replicaSet=MainRepSet
    2018-06-08T12:59:10.569+0000 I NETWORK  [thread1] Starting new replica set monitor for MainRepSet/mongodb-service:27017
    2018-06-08T12:59:10.613+0000 I NETWORK  [thread1] Successfully connected to mongodb-service:27017 (1 connections now open to mongodb-service:27017 with a 5 second timeout)
    2018-06-08T12:59:10.623+0000 I NETWORK  [thread1] Successfully connected to mongod-1.mongodb-service.default.svc.cluster.local:27017 (1 connections now open to mongod-1.mongodb-service.default.svc.cluster.local:27017 with a 5 second timeout)
    2018-06-08T12:59:10.625+0000 I NETWORK  [thread1] changing hosts to MainRepSet/mongod-0.mongodb-service.default.svc.cluster.local:27017,mongod-1.mongodb-service.default.svc.cluster.local:27017,mongod-2.mongodb-service.default.svc.cluster.local:27017 from MainRepSet/mongodb-service:27017
    2018-06-08T12:59:10.628+0000 I NETWORK  [ReplicaSetMonitor-TaskExecutor-0] Successfully connected to mongod-0.mongodb-service.default.svc.cluster.local:27017 (1 connections now open to mongod-0.mongodb-service.default.svc.cluster.local:27017 with a 5 second timeout)
    2018-06-08T12:59:10.636+0000 I NETWORK  [ReplicaSetMonitor-TaskExecutor-0] Successfully connected to mongod-2.mongodb-service.default.svc.cluster.local:27017 (1 connections now open to mongod-2.mongodb-service.default.svc.cluster.local:27017 with a 5 second timeout)
    MongoDB server version: 3.6.5
    MainRepSet:PRIMARY>
    ```
    
    Within the Replica Set we first need to authenticate as main admin using the password from above:
    
    ```
    MainRepSet:PRIMARY> db.getSiblingDB("admin").auth("main_admin", "Pabc123!");
    1
    MainRepSet:PRIMARY> 
    ```
    
    Then we switch to database auth1:
    
    ```
    MainRepSet:PRIMARY> use auth1
    switched to db auth1
    MainRepSet:PRIMARY> 
    ```
    
    Finally we create the power user with password "12345" having readWrite rights:
    
    ```
    MainRepSet:PRIMARY> db.createUser({user:"auth1_readWrite",pwd:"12345",roles:[{role:"readWrite",db:"auth1"}]});
    Successfully added user: {
           "user" : "auth1_readWrite",
           "roles" : [
                   {
                           "role" : "readWrite",
                           "db" : "auth1"
                   }
           ]
    }
    MainRepSet:PRIMARY>
    ```
    
    Don't exit yet, please go on:
    

2. We also insert "dummy" data into auth1.users collection in order for the auth1 database to get initially created.

    ```
    MainRepSet:PRIMARY> db.users.insert({email:"test@test.com", password:"$2a$10$aUtm0y1MOmXWrQ74J2foruyYbPRC408Y9HdG6YLS1PJJIfBFG.K8i"});
    WriteResult({ "nInserted" : 1 })
    MainRepSet:PRIMARY>
    ```
    
    This will allow us later to login with username=test@test.com and password=password
    
    The hash `"$2a$10$aUtm0y1MOmXWrQ74J2foruyYbPRC408Y9HdG6YLS1PJJIfBFG.K8i"` for the string `"password"` results from bcrypt library using salt(10) - see `user.js` file in root/code/server/models.
    
    Now we can exit (twice! Once to exit the MongoDB shell, then to exit the mongod-0's bash):
    
    ```
    MainRepSet:PRIMARY> exit
    bye
    root@mongod-0:/# exit
    exit
    command terminated with exit code 1
    >
    ```

    Puh !

## <a id="chapter3a2"></a>b. Server: Node Server deployment

Next we'll take care of our express node-api that our React/Redux App needs to connect to MongoDB.
Also the express node-api will take care of handling JWT tokens (just to mention it).

First check into root/code/server/index.js

Comment out LOCAL SETUP section and
Comment out DOCKER SETUP section and
Comment in KUBERNETES SETUP section like so:

```
// IMPORTANT:
// Comment-in what you need, comment-out what you don't need:
// LOCAL SETUP:
// mongoose.connect('mongodb://localhost:27017/auth1');
// DOCKER SETUP:
// mongoose.connect('mongodb://db:27017/auth1');
// KUBERNETES SETUP:
mongoose.connect('mongodb://auth1_readWrite:12345@mongodb-service:27017/auth1?replicaSet=MainRepSet');
```

Let's have a look at our deployment file `express-deployment.yml` now. 

*It also consists of 2 parts:*

1. Service deployment

    ```
    apiVersion: v1
    kind: Service
    metadata:
      name: express-service
    ```
    
    The Service `name: express-service` is our exposed end-point of the express node-api. The React/Redux App will connect to it using `port 30001` (see later).
    
    The Service acts as a NodePort (Range: 30000-32767, port 80 NOT possible), enabling communication with the world outside of the cluster (internet).


2. Deployment deployment :)

    ```
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: express-deployment
    spec:
      replicas: 1
    ```
    
    We start with only one replica. Running extra machines for extra replicas are cost intensive.
    
    More about the `express-deployment.yml` file below:
  
  
Before we run `kubectl apply -f express-deployment.yml` in kubernetes/minikube directory, we need to make a decision:

1. Should Minikube pull the image from Docker Hub (or your preferred Docker Registry)

    First login to Docker Hub (logout again: `docker logout`)

    ```
    > docker login
    Login with your Docker ID to push and pull images from Docker Hub. If you don't have a Docker ID, head over to https://hub.docker.com to create one.
    Username: herrkraatz
    Password:
    Login Succeeded
    >
    ```
    Then create the image locally first:
    
    ```
    > cd root/code/server
    > docker image build -t herrkraatz/node-api .
    ```
    `-t herrkraatz/node-api` you must set the tag to your <username>/<image-name>
    
    When done, push to Docker Hub:
        
    ```
    > docker image push herrkraatz/node-api
    ```
    
    Last: In `express-deployment.yml` file replace ...
    
    ```
    image: k8s-node-api
    imagePullPolicy: Never
    ```
    
    ... with:
    
    ```
    image: herrkraatz/node-api
    ```
    

2. or should Minikube pull the image locally from your own Docker engine?

    We go for the latter here. But also here there's still something to do:
     
    Open a Terminal window and cd into root/code/server, then run
    
    ```
    > eval $(minikube docker-env)
    ```
    
    This will enable to build the image with the Docker daemon of Minikube. This is only possible now in the Terminal window
    where you ran `eval $(minikube docker-env)`.
    
    *Note: Running `docker image ls` is quite interesting now. It shows all images used by Kubernetes engine (Minikube).*
    
    Ok, next, let's build the image:
    
    ```
    > docker image build -t k8s-node-api .
    ```
    
    We call it `k8s-node-api` to be different from our Docker image `node-api` that we might still need for testing outside of Minikube.
    
    *Note: We can ignore these warnings*
    ```
    npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.4 (node_modules/fsevents):
    npm WARN added 328 packages in 42.605s
    notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.4: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})
    ```


If you have choosen first or second option, now's the time to run in kubernetes/minikube directory:

```
> kubectl apply -f express-deployment.yml
```

Done.


## <a id="chapter3a3"></a>c. Client: React/Redux App deployment

First check into root/code/client/src/actions/index.js

Comment out LOCAL + DOCKER SETUP section and
Comment in KUBERNETES SETUP section like so:

```
// IMPORTANT:
// Comment-in what you need, comment-out what you don't need:
// LOCAL + DOCKER SETUP:
// const ROOT_URL = 'http://localhost:3090';
// KUBERNETES SETUP:
const ROOT_URL = 'http://192.168.99.100:30001';
console.log("ROOT_URL", ROOT_URL);
```

You will get the ROOT_URL that the client React/Redux App has to connect to by running in any Terminal window now: `minikube service express-app --url`

```
> minikube service express-app --url
http://192.168.99.100:30001
>
```

Now let's create a new build (needed if we change code in root/code/client directory):

```
> cd root/code/client
> npm run build
```

When done, let's have a look at our deployment file `react-deployment.yml`:

*It also consists of 2 parts:*

1. Service deployment

    ```
    apiVersion: v1
    kind: Service
    metadata:
      name: react-service
    ```
    
    The Service `name: react-service` is our exposed end-point of our React/Redux App, which the user requests in his/her browser.
   
    The Service acts as a NodePort (Range: 30000-32767, port 80 NOT possible), enabling communication with the world outside of the cluster (internet).
    
    To make the React/Redux App available on port 80, we need to either change type NodePort to type LoadBalancer (which can get cost intensive on AWS), 
    or we keep `react-service` run internally within the cluster on port `30003` and install Ingress or another Load Balancer (see below: Scaling the cluster up) which runs outside the cluster, receives requests on port 80, 
    and connects to internally running `react-service` through port `30003`.


2. Deployment deployment :)

    ```
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: react-deployment
      labels:
        app: react-app
    spec:
      replicas: 1
    ```
    
    We start with only one replica. Running extra machines for extra replicas are cost intensive.
        
    More about the `react-deployment.yml` file below.
    
    
Before we run `kubectl apply -f react-deployment.yml` in kubernetes/minikube directory, we again need to make a decision:

1. Should Minikube pull the image from Docker Hub (or your preferred Docker Registry)

    If you go this path, just do similar as in Server: Node Server deployment:
    
    Be sure to be logged into docker.
    
    Then create the image locally first:
        
    ```
    > cd root/code/client
    > docker image build -t herrkraatz/react-nginx .
    ```
    `-t herrkraatz/react-nginx` you must set the tag to your <username>/<image-name>
    
    When done, push to Docker Hub:
        
    ```
    > docker image push herrkraatz/react-nginx
    ```
    
    Last: In `react-deployment.yml` file replace ...
    
    ```
    image: k8s-react-nginx
    imagePullPolicy: Never
    ```
        
    ... with:
    
    ```
    image: herrkraatz/react-nginx
    ```
        

2. or should Minikube pull the image locally from your own Docker engine?

    Again: Be sure that you build the local image in a Terminal window where you ran `eval $(minikube docker-env)` before.

    Then build the image like this:

    ```
    > cd root/code/client
    > docker image build -t k8s-react-nginx .
    ```


When done (either option 1 or 2), run in kubernetes/minikube directory:

```
> kubectl apply -f react-deployment.yml
```

## <a id="chapter3a4"></a>d. Testing it all within our Minikube cluster running our images in multiple Pods (React/Redux App + Node Server + MongoDB)

You will get the address of our React/Redux App like this (run in any Terminal window): `minikube service react-app --url`

```
> minikube service react-app --url
http://192.168.99.100:30003
>
```

You will probably see another IP here and use that one instead ...

Open browser, then open:

```
http://192.168.99.100:30003
```

Opening http://192.168.99.100:30003 should show the login screen again. 
Trying to Sign In with your previously created user account WILL NOT work, as we haven't copied the data of our Docker container's MongoDB into the cluster's MongoDB Replica Set ... I was too lazy :)

But: We have our username=test@test.com with password=password already inserted. Let's try it.

Again: You can doublecheck via free [MongoDB GUI Robo 3T](https://robomongo.org/).

To use Robo 3T, here are the steps (unfortunately didn't get it to run using headless Service under `mongodb-service:27017`):

1. First expose (publish) a port for mongod-0 Pod:

```
> kubectl expose pod mongod-0 --type=NodePort
```
    
2. Get the exposed port:

```
> kubectl get service
NAME              TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
express-app       NodePort       10.97.118.53     <none>        3090:30001/TCP    3h
kubernetes        ClusterIP      10.96.0.1        <none>        443/TCP           3h
mongod-0          NodePort       10.100.66.224    <none>        27017:31437/TCP   4m
mongodb-service   ClusterIP      None             <none>        27017/TCP         3h
react-app         NodePort       10.96.190.98     <none>        80:30003/TCP      1h
>
```

We need to look at line with `mongod-0`: The port will be forwarded from 27017 to 31437: `27017:31437/TCP`

So the exosed port is `31437`

3. Enter Connection Details in Robo 3T:

    - Go to File >> Connect
    - Name: "Minikube Connection"
    - Address: 92.168.99.100:31437
    
    The Address is Minikube's IP `minikube ip` + exposed port `31437`
    
    - On Authentication Tab:
        - Database: admin
        - Username: main_admin
        - Password: Pabc123!
        
    Hit Save and Connect !

4. Once you're done with Robo 3T for good, you can delete the exposed port (service) again:

```
> kubectl delete service mongod-0
```

## <a id="chapter3a5"></a>e. Scaling the cluster up

Is your application too slow? Did you localize your bottleneck ? Let's talk about all 3 tiers.

### Database: MongoDB deployment

Scaling up becomes really necessary? Check out this BEFORE scaling up: https://stackoverflow.com/questions/43804022/mongodb-load-balancer-for-the-replica-set

Scenarios:

- Too many concurrent READ operations:

    If your Pods reach their limits and get slow, you can think of scaling up the Replica Set to 5 members:
    
    - Adding two extra secondary members or one extra secondary member and an arbiter member
    
        The total number of members should be uneven. 
        Otherwise the situation could occur that, say in a Replica Set of 6 members, 3 members are up and running, and 3 other members are down. 
        In this case Kubernetes does not know what to do: "Is MongoDB really still reliably working or should I better declare the whole MongoDB cluster things as OFF in order to protect data consistency?!"
    
    - Sharding: If adding secondary members doesn't help, you can think of setting up a Sharded Cluster (see right below). If the data becomes too big for a single MongoDB instance you probably need to distribute (split) your data over different machines (or clusters). One approach is to have US customer detail data on one sharded cluster, Asian customer detail data on another sharded cluster.
    
- Too many concurrent WRITE operations: 
    If your Pods reach their limits and get slow, you can think of setting up a Sharded Cluster (see https://docs.mongodb.com/manual/sharding/) with 
    - multiple mongos (to route requests), 
    - multiple config servers (to determine which Replica Set is least busy), and 
    - multiple Replica Sets
 
Scaling up:

- Sharding is not subject of this tutorial. 
- Here comes an idea of how to scale up MongoDB's Replica Set (Kubernetes' StatefulSet) - see https://kubernetes.io/blog/2017/01/running-mongodb-on-kubernetes-with-statefulsets/

    Scaling up from 3 replicas to 5 replicas:
    
    First add a sidecar MongoDB container to each MongoDB container. 
    The sidecar container was created to automatically configure the new MongoDB Nodes to join the Replica Set.
    
    ```
    - name: mongo-sidecar
      image: cvallance/mongo-k8s-sidecar
      env:
        - name: MONGO\_SIDECAR\_POD\_LABELS
          value: "role=mongo,environment=test"
    ```
    
    About sidecar MongoDB: https://github.com/cvallance/mongo-k8s-sidecar
    
    Now we have 2 options how to deploy:
    
    1. Via `db-deployment.yml` file:
    
        Change from replicas: 3 to replicas: 5
        
        ```
        spec:
          serviceName: mongodb-service
          replicas: 5
        ```
        
        Next we need to apply the new `db-deployment.yml` file:
            
        ```
        > cd root/kubernetes/minikube
        > kubectl apply -f db-deployment.yml
        ```
        
    2. We deploy via `kubectl scale` command:
    
        ```
        > kubectl scale --replicas=5 statefulset mongod
        ```    
    
Further reading:

- Good answers: https://dba.stackexchange.com/questions/130321/can-mongodb-be-configured-to-sit-behind-a-load-balancer
- A bit old, but nice diagrams: https://severalnines.com/blog/turning-mongodb-replica-set-sharded-cluster
  
  
### Server: Node Server deployment

In Database deployment the Client MongoDB driver connected to the Replica Set is responsible for Load Balancing, 
but for Server deployment and Client deployment it's the Service layer which is responsible.

How Services work:
https://kubernetes.io/docs/concepts/services-networking/connect-applications-service/

How Proxying (service proxy / kube-proxy) + Load Balancing work:
https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies

Recommendation to save costs on AWS later: 

- Let's start with one replica `replicas: 1` (see `express-deployment.yml` file)
- which is exposed to the outside world with `type: NodePort` and NOT with `type: LoadBalancer` (cost intensive)

NodePort vs. LoadBalancer:

- type NodePort does NOT allow port 80; default port range: 30000-32767
- type NodePort + type LoadBalancer enable external access (from internet) to a Service. 
- type NodePort is usually for testing and provides basic Load Balancing. 
- type LoadBalancer is sitting outside of our cluster and is cloud specific (can become expensive). 
- Ingress Load Balancer could be the better choice (see below)

See also:

- https://rancher.com/load-balancing-in-kubernetes/
- https://medium.com/google-cloud/kubernetes-nodeport-vs-loadbalancer-vs-ingress-when-should-i-use-what-922f010849e0
- https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport
- https://kubernetes.io/docs/concepts/services-networking/service/#type-loadbalancer

Ingress + Nginx/Ingress Load Balancer:

- https://kubernetes.io/docs/concepts/services-networking/ingress/
- https://github.com/kubernetes/charts/tree/master/stable/nginx-ingress

Other Load Balancers:

- https://www.envoyproxy.io/
- https://www.nginx.com/blog/what-is-a-service-mesh/

Anyway, independent of the Load Balancer you will choose one day, if you need to scale up Pods in our Server deployment:

1. Manually scaling up Pod (1 --> 3)

    ```
    > kubectl scale --replicas=3 deployment express-deployment
    ```  
      
    or edit `express-deployment.yml` file:   
    
    ```
    spec:
      replicas: 3
    ```
    
    Then run:
    
    ```
    > cd root/kubernetes/minikube
    > kubectl apply -f express-deployment.yml
    ```
                        
    Doublecheck 3 Endpoints now:
    
    ```
    > kubectl describe svc express-service
    Name:                     express-service
    Namespace:                default
    Labels:                   app=express-app
    Annotations:              kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app":"express-app"},"name":"express-service","namespace":"default"},"spec":...
    Selector:                 app=express-app
    Type:                     NodePort
    IP:                       10.97.118.53
    Port:                     <unset>  3090/TCP
    TargetPort:               3090/TCP
    NodePort:                 <unset>  30001/TCP
    Endpoints:                172.17.0.12:3090,172.17.0.13:3090,172.17.0.14:3090
    Session Affinity:         None
    External Traffic Policy:  Cluster
    Events:                   <none>
    > 
    ```

2. Autoscaling: Let Kubernetes engine take care of it

    Autoscaling is done with Horizontal Pod Autoscaler (HPA):
    
    ```
    > kubectl autoscale deployment express-deployment --cpu-percent=50 --min=1 --max=5
    ```
    `--cpu-percent=50` means: The target(ed) average CPU utilization (represented as a percent of requested CPU) over all the Pods. 
    In other words: Each Pod gets half as much CPU as it would usually ask for.
    
    If it's not specified or negative (`-1`), a default autoscaling policy will be used.
    
    `--min=1` means minimum 1 Pod
    
    `--max=5` means maximum 5 Pods
    
    Summary:
    
    - HPA tries to keep application performant
    - Adjusts the number of replicas, up or down, e.g. between min=1 and max=5, 3 Pods may become the perfect fit at a time for an average CPU limit specified by the admin
    - When total CPU hits > 50%, it will try to add another replica (Pod)
    
    Further reading:
    
    - https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#autoscale
    - https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
    - https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-cpu
    
    How we do it:
    
    1. Add new parameters (`resources` key) to `express-deployment.yml` file: 
    
        ```
        containers:
        - name: express-app
          image: k8s-node-api
          imagePullPolicy: Never
          ports:
          - containerPort: 3090
          resources:
            requests:
              cpu: "100m"
            limits:
              cpu: "200m"
        ```
        
        `100m` means 10% (or 100 of 1000 (m))
        
    2. Terminal window #1: Add HPA:
    
        ```
        > kubectl autoscale deployment express-deployment --cpu-percent=50 --min=1 --max=5
        ```
    
    3. In new Terminal window: Run BusyBox to bring Pod to a limit:
    
        Run BusyBox:
    
        ```
        > kubectl run -i -tty load-generator --image=busybox /bin/sh
        ```
    
        Run infinite loop (where http://express-deployment.default.svc.cluster.local:30001 is our DNS, getting called on port 30001):
    
        ```
        > while true ; do wget -q -O- http://express-deployment.default.svc.cluster.local:30001 ; done
        ```
    
    4. In Terminal window #1 run:
    
        ```
        > kubectl get hpa
        ```
    
    --> Replicas will go up soon.


### Client: React/Redux App deployment

What is valid for Node Server deployment is also valid for React/Redux App deployment. If it becomes a bottleneck, you need to scale up and eventually replace NodePort Service with a better Load Balancer.

Recommendation to save costs on AWS later: 

- Let's start with one replica `replicas: 1` (see `react-deployment.yml` file)
- which is exposed to the outside world with `type: NodePort` and NOT with `type: LoadBalancer` (cost intensive)


## <a id="chapter3a6"></a>f. How To: Deployment A depends on Deployment B

We have the case, that, when Minikube restarts, the Node Server deployment is faster up and already trying to connect to MongoDB Replica Set 
than MongoDB deployment is up and MongoDB Replica Set is ready to receive requests.

Our easy workaround:

Wait some more moments, until MongoDB is ready.

Then delete Node Server Deployment (and Pod) and re-deploy it.

```
> cd root/kubernetes/minikube
> kubectl delete deployment express-deployment
> kubectl apply -f express-deployment.yml
```

A better approach is to use an initContainer (see https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
within Deployment A that checks on Deployment B if B's inner services are up and running and only then exits 
to tell Kubernetes: "Now run the main Container of Deployment A".

Here's how the `express-deployment.yml` file looks:

```
spec:
      containers:
      - name: express-app
        image: k8s-node-api
        imagePullPolicy: Never
        ports:
        - containerPort: 3090
      initContainers:
      - name: init-express-app
        image: busybox
        command: ['sh', '-c', 'sleep 60;']
```

We could use BusyBox image (see https://busybox.net/about.html) to do standalone pings to other services. 
Only if all commands are executed, Kubernetes will go on running main container `express-app`.

As you can see, a sleep of 60 seconds isn't very professional, 
and the React Deployment now also has to wait 60 seconds until Express Deployment is ready, 
but this does it for now. 
It took me a long time to ping the MongoDB Replica Set from Express Deployment, but I didn't get it to run: 

- The mongodb-service was available BEFORE the 3 Replica Set members were.
- Exposing all three members (publishing their ports) and pinging those timed out.

Anyway, Minikube isn't our production ready environment.

I took it out again. Otherwise you need to wait 60 seconds even when during development (if you need to restart express).

Let's move on.

## <a id="chapter3a7"></a>g. How To: Debugging / Monitoring

### Important of course is to have a look into the log files:

1. First get the exact name of the Pod

    ```
    > kubectl get pods
    NAME                                  READY     STATUS    RESTARTS   AGE
    express-deployment-75f978c7f5-546lp   1/1       Running   0          7h
    mongod-0                              1/1       Running   0          7h
    mongod-1                              1/1       Running   0          7h
    mongod-2                              1/1       Running   0          7h
    react-deployment-6dcb5cbdd6-drnh4     1/1       Running   0          7h
    ```
 
2. Get logs

    ```
    > kubectl logs express-deployment-75f978c7f5-546lp
    
    > server-app@1.0.0 start /express
    > node ./index.js
    
    Server listening on port: 3090
    > 
  
    ```
### Often we also need to open a shell in a Pod (if still up) to see what's going on

1. We can either quickly create a temporary Pod from an nginx image pulled on the fly from kubernetes:

    Run in any directory:
    
    ```
    > kubectl create -f https://k8s.io/docs/tasks/debug-application-cluster/shell-demo.yaml
    pod "shell-demo" created
    
    > kubectl get pod shell-demo
    NAME         READY     STATUS    RESTARTS   AGE
    shell-demo   1/1       Running   0          13s
    
    > kubectl exec -it shell-demo -- /bin/bash
    root@shell-demo:/# do fun stuff !
    ```
    
    See https://kubernetes.io/docs/tasks/debug-application-cluster/get-shell-running-container/

2. Or we open a shell within one of our own Pods:

    Run in any directory:
    
    ```
    > kubectl get pods
    NAME                                  READY     STATUS    RESTARTS   AGE
    express-deployment-7496c9b686-gjrmz   1/1       Running   1          12m
    mongod-0                              1/1       Running   4          19h
    mongod-1                              1/1       Running   4          19h
    mongod-2                              1/1       Running   4          19h
    react-deployment-6dcb5cbdd6-6j8vt     1/1       Running   4          17h
    shell-demo                            1/1       Running   1          22m
    > 

    > kubectl exec -it express-deployment-7496c9b686-gjrmz /bin/ash
    /express # do fun stuff !
    ```
    
    *Note:*
    
    Our express Deployment (Node Alpine Image) doesn't support bash, only ash and sh (see https://github.com/smebberson/docker-alpine/issues/43)

### Monitoring with Heapster

Besides dashboard (`minikube dashboard`), Minikube can run a GUI called Heapster in your local browser, a monitoring tool, but we need to quickly set it up first.

What Heapster can monitor:

 - CPU
 - Memory
 - Network
 - Storage by Pod

How it works:

 - Heapster, talks to kubelet (kubelet runs pods, and resolves DNS names to DNS service IP addresses) which fetches the data from C-Advisor, then it stores data into
 - InfluxDB, and the data will be visualized through:
 - Grafana
 
All clear? Let's just run it:

```
> minikube addons enable heapster
heapster was successfully enabled

> kubectl get pods  --namespace=kube-system
NAME                                    READY     STATUS    RESTARTS   AGE
etcd-minikube                           1/1       Running   0          2h
kube-addon-manager-minikube             1/1       Running   4          1d
kube-apiserver-minikube                 1/1       Running   0          2h
kube-controller-manager-minikube        1/1       Running   0          2h
kube-dns-86f4d74b45-chhwl               3/3       Running   14         1d
kube-proxy-n66gz                        1/1       Running   0          2h
kube-scheduler-minikube                 1/1       Running   2          1d
kubernetes-dashboard-5498ccf677-q597s   1/1       Running   14         1d
storage-provisioner                     1/1       Running   13         1d

> minikube addons open heapster
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
Waiting, endpoint for service is not ready yet...
^C

> kubectl get pods --namespace=kube-system
NAME                                    READY     STATUS    RESTARTS   AGE
etcd-minikube                           1/1       Running   0          2h
heapster-s8l4r                          1/1       Running   0          5m
influxdb-grafana-rr2pv                  2/2       Running   0          5m
kube-addon-manager-minikube             1/1       Running   4          1d
kube-apiserver-minikube                 1/1       Running   0          2h
kube-controller-manager-minikube        1/1       Running   0          2h
kube-dns-86f4d74b45-chhwl               3/3       Running   14         1d
kube-proxy-n66gz                        1/1       Running   0          2h
kube-scheduler-minikube                 1/1       Running   2          1d
kubernetes-dashboard-5498ccf677-q597s   1/1       Running   14         1d
storage-provisioner                     1/1       Running   13         1d

> minikube addons open heapster
Opening kubernetes service kube-system/monitoring-grafana in default browser...
>
```

Then: 

Home >> Signin: Username: admin, Password: admin

Then choose the Pods from Menu that you want to monitor.

## <a id="chapter3a8"></a>h. How To: An image has to be re-built and re-deployed

Here's the order you need to follow.  
We want to re-deploy our Client React/Redux App image on Minikube cluster after we made some changes to the image.

Open 2 Terminal windows.

1. One in the root/kubernetes/minikube directory:

Delete the Deployment first (because we also want to delete the underlying image, not possible otherwise)

```
> kubectl delete deployment react-deployment
```

2. The second Terminal window should get opened where the Dockerfile is, 
e.g. for Client React/Redux App image it's root/code/client directory:

Run these commands:

```
> eval $(minikube docker-env)
> docker image rm k8s-react-nginx
> docker image build -t k8s-react-nginx .
```

3. Back to Terminal window #1:

Run:

```
> kubectl apply -f react-deployment.yml
```

Before we re-applied our `react-deployment.yml` file, we needed to first delete the Deployment.
This also removed its Pod, what command `kubectl replace -f` is NOT doing. 
So if we didn't delete it first, a recreation of our Deployment would not have recreated a new Pod !

Done.

Important: 
In this How To we also wanted to deleted the image as it will not be overwritten by Docker daemon.
We do this to save space on disk. 
But if you like to keep the versions, don't delete it. 

You can delete image versions later on by first listing all images ...

```
> eval $(minikube docker-env)
> docker image ls
REPOSITORY                                 TAG                 IMAGE ID            CREATED             SIZE
k8s-react-nginx                            latest              102b872be20c        12 seconds ago      109MB
<none>                                     latest              4534fh774e77        2 days ago          109MB
>
```
... and then deleting the previous version(s) (<none>) by IMAGE ID:
 
```
> docker image rm 4534fh774e77
```

## <a id="chapter3a9"></a>i. Clean up / Teardown / Undeployment

After we have tried out everything on Minikube and all works, we might need to clean up again.

### Database: MongoDB undeployment

The script will take care of deleting our headless Service, the StatefulSet, the Secret, and the Volumes.

Run in any directory:

```
> sh 03-undeploy_MongoDB_Cluster.sh
```

For more information please check out this great doc of Paul Done: https://github.com/pkdone/minikube-mongodb-demo


### Server: Node Server undeployment

The script will take care of deleting our Service and the Deployment (plus Pod).

Run in any directory:

```
> sh 04-undeploy_Node_Server.sh
```

### Client: React/Redux App undeployment

The script will take care of deleting our Service and the Deployment (plus Pod).

Run in any directory:

```
> sh 05-undeploy_React_Redux_App.sh
```

## <a id="chapter3b"></a>ii. Ready for deployment? Let's push it to AWS - with kops cli and aws cli

IMPORTANT: One hour on AWS with 7 Linux machines running can cost some Dollars already. So please be careful !!

If you're done with Kubernetes testing on AWS, first delete the cluster again (see below) 
and better delete your entire AWS account after that if you're not 100% sure what you're doing.

Also kops cli is stable, but nobody is perfect. When deleting the cluster via kops cli always something can go wrong.
So also better check on AWS console if the resources are really deleted.


### Install kops cli

If you haven't kops installed on your machine, please install free kops cli ([Instructions](https://github.com/kubernetes/kops)).

With kops you will be able to deploy your Docker images on ASW (or on another cloud, or on your own solution).


### Install aws cli

If you haven't kops installed on your machine, please install free kops cli ([Instructions](https://docs.aws.amazon.com/cli/latest/userguide/installing.html), [Easier](https://docs.aws.amazon.com/cli/latest/userguide/awscli-install-bundle.html#install-bundle-other)).

With kops you will be able to deploy your Docker images on ASW (or on another cloud, or on your own solution).



## <a id="chapter3b1"></a> a. Architecture

One Master Node (parent), one etcd data store, and 5 Application Nodes (children).

1. The Master will run Kubernetes services / engine:

    - kube-apiserver
    - kube-controller-manager
    - kube-scheduler
    
    ... relying on:
    
2. etcd which is 
    
    - a key:value database
    - a distributed key store that stores all cluster Master data
    - is independent from Kubernetes
    
    And etcd should run on another machine, other than the Master does.

3. The 5 Application Nodes running 

    - MongoDB Replica Set (3)
    - Express Server (1)
    - React/Redux App (1)


More:

- One Linux machine per Master/etcd
- All Master Nodes should run kubelet (Monitoring the health of your Pods)
- All Master Nodes should run kube-api (accepts kubectl commands), should be behind Load Balancer

So in total we'll have 7 Linux machines running (Master, etcd, 5 Application Nodes)

## <a id="chapter3b2"></a> b. Deployment Steps

1. Create AWS Account

2. Get Security Credentials (Key) from User Account (Top Menu Bar)

3. Configure aws cli

    ```
    > aws configure
    Enter Key/Secret
    Enter Region: us-east-1
    Output format: None
    >
    ```
    Enter Key/Secret: see 2. above
    Enter Region: see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html

4. Create aws S3 bucket as state store (where info about our cluster is stored that kops needs to operate with)

    ```
    > aws s3api create-bucket --bucket kubernetes-demo-bucket --region us-east-1
    {
        "Location": "/kubernetes-demo-bucket"
    }
    >
    ```
    
    Before, we tried with a LocationConstraint, but didn't work (https://github.com/elastic/elasticsearch/issues/16978):
    
    ```
    > aws s3api create-bucket --bucket kubernetes-demo-bucket --region us-east-1 --create-bucket-configuration LocationConstraint=us-east-1
    ```
   
    So let's go on without LocationConstraint. This might be an issue on us-east-1 only.


5. Create cluster using kops having ONE Master

    Create environment variable:
    
    ```
    > export KOPS_STATE_STORE=s3://kubernetes-demo-bucket
    ```

    Create secret:
    
    ```
    > kops create secret --name kubernetes-demo-cluster.k8s.local sshpublickey admin -i ~/.ssh/id_rsa.pub
    ```
    
    (Alternatively run: `ssh-keygen`)
    
    Finally the cluster:
    
    ```
    > kops create cluster kubernetes-demo-cluster.k8s.local --zones us-east-1a --yes
    ```
    
    This will take some minutes, and will end with:
    
    ```
    Suggestions:
     * validate cluster: kops validate cluster
     * list nodes: kubectl get nodes --show-labels
     * ssh to the master: ssh -i ~/.ssh/id_rsa admin@api.kubernetes-demo-cluster.k8s.local
     * the admin user is specific to Debian. If not using Debian please use the appropriate user based on your OS.
     * read about installing addons at: https://github.com/kubernetes/kops/blob/master/docs/addons.md.

    >
    ```
    
    *Important Note:*
    
    kops now established a connection between kubectl and the cluster on aws, NOT the minikube any more, 
    see kubectl context here: https://kubernetes.io/docs/getting-started-guides/minikube/#deleting-a-cluster

6. We love quality, so we follow kops' suggestions from above:

    ```
    Suggestions:
     * validate cluster: kops validate cluster
     * list nodes: kubectl get nodes --show-labels
     * ssh to the master: ssh -i ~/.ssh/id_rsa admin@api.kubernetes-demo-cluster.k8s.local
     * the admin user is specific to Debian. If not using Debian please use the appropriate user based on your OS.
     * read about installing addons at: https://github.com/kubernetes/kops/blob/master/docs/addons.md.
    ```
    
    - validate cluster: 
    
    ```
    > kops validate cluster
    ```

    - list nodes: 
    
    ```
    > kubectl get nodes --show-labels
    ```
        
    - ssh to the master works?
    
    ```
    > ssh -i ~/.ssh/id_rsa admin@api.kubernetes-demo-cluster.k8s.local
    ```
    
    `api.kubernetes-demo-cluster.k8s.local` probably won't work (DNS can't be resolved),
    so we need Plan B:
    
    Go to AWS console, then go to EC2 >> Instances >> Choose Master >> Copy the Public DNS name
    
    ```
    > ssh -i ~/.ssh/id_rsa admin@Public DNS name
    ```
    
    When you are on AWS, you can 
    
    1. watch running processes:
    
        ```
        > ps ax
        ```

    2. check into kube-apiserver logs:
    
        ```
        > cd /var
        > cd log
        > ls
        > sudo cat kube-apiserver.log
        ```

    3. check running docker containers:
    
        ```
        > sudo container ls
        ```
        
    4. don't forget to exit
    
        ```
        > exit
        ```
        
7. Check deployments (from your machine via kubectl):

    ```
    > kubectl get deployments --namespace=kube-system
    ```
 
8. Finally let's deploy our 3 tiers to AWS:

    Follow the SAME steps as above (run 2 shell scripts for MongoDb, run `kubectl apply` commands for Server and Client),
     
    BUT: Run it in root/kubernetes/cloud directory, not in root/kubernetes/minikube. For easier debugging you should keep a running version of yaml files on Minikube if you do testing on AWS.

9. Testing

    Check your deployments (from your machine via kubectl):
    
    ```
    > kubectl get deployments
    ```

    Check single deployment
        
    ```
    > kubectl describe deployment express-deployment
    ```
    
    Which Node(s) are our Pod(s) running on?
    
    ```
    > kubectl describe pods
    ```
    
    Check if AWS created a persistentVolume automatically (aws-ebs-dynamic-provisioner does it):
    
    ```
    > kubectl describe persistentvolumes
    ```

    Get react-service's IP address:
        
    ```
    > kubectl describe service react-service
    ```
    
    Paste URL (using port 30003) into browser and Sign In !
    
    
10. Scaling up or: Bringing our Pods to the limit!

    Warning! This will additionally increase costs, so be sure what you're doing ! 
    More than 7 Linux machines will be running ! Have extra attention on cleaning up after ! And don't forget to kill BusyBox !
     
    I recommend to do manual upscaling or autoscaling on the Node Server deployment only because I described it in detail in Minikube section above ("Scaling the cluster up"): 
    
    Server: Node Server deployment:
    
    1. Manual scaling or
    
    2. Autoscaling
    
    Follow same instructions as on Minikube.

## <a id="chapter3b3"></a> c. Important ! Cleanup ! 

IMPORTANT: One hour on AWS with 7 Linux machines running can cost some Dollars already. So please be careful !!

If you're done with Kubernetes testing on AWS, first delete the cluster again (see below) 
and better delete your entire AWS account after that if you're not 100% sure what you're doing.

Also kops cli is stable, but nobody is perfect. When deleting the cluster via kops cli always something can go wrong.
So also better check on AWS console if the resources are really deleted.


How to delete the cluster again:

```
> kops delete cluster kubernetes-demo-cluster.k8s.local --yes
```
    
Make sure at the end this line shows up:

```
...
Deleted cluster: "kubernetes-demo-cluster.k8s.local"
>
```

## <a id="chapter4"></a>4. Important last ToDo's

### Add config.js to .gitignore

- Our file server/config.js contains our secret for passport service. Do NOT push it to github !

### Cleanup AWS !

- Follow AWS Cleanup right above if you just use AWS for testing out Kubernetes. AWS charges !

## <a id="chapter5"></a>5. Links

### Have a look (Load Balancing links see inline above)

1. MongoDB Database

    - MongoDB on Minikube: https://github.com/pkdone/minikube-mongodb-demo
    - Minikube YAML: https://github.com/pkdone/minikube-mongodb-demo/blob/master/resources/mongodb-service.yaml
    - More of Paul Done: http://k8smongodb.net/
    - YAML with MongoDB Sidecar (Helper-Image): https://kubernetes.io/blog/2017/01/running-mongodb-on-kubernetes-with-statefulsets/
    - MongoDB Sidecar: https://github.com/cvallance/mongo-k8s-sidecar
    - YAML with Sharding & ConfigDB: https://sunnykrgupta.github.io/sharded-mongodb-in-kubernetes-statefulsets-on-gke.html
 
    
2. Node Server

    - https://github.com/bmnicolae/docker-react-node
    - https://github.com/StephenGrider/AdvancedReduxCode

    
3. React/Redux App

    - https://github.com/bmnicolae/docker-react-node
    - https://github.com/StephenGrider/AdvancedReduxCode
    - https://github.com/StephenGrider/ReduxSimpleStarter

4. Best practices for Kubernetes in Production

    - Auto-deployments general: https://techbeacon.com/one-year-using-kubernetes-production-lessons-learned
    - Auto-deployments with Weave: https://www.weave.works/technologies/weaveworks-on-aws/
    - Best practice I: https://www.weave.works/blog/kubernetes-best-practices
    - Best practice II: https://github.com/arschles/kube-best-practices
    - Best practice III: https://medium.com/tailor-tech/production-grade-kubernetes-on-aws-4-tools-that-made-our-lives-easier-29438e8b58ca
    - With Github Authentication: https://medium.freecodecamp.org/how-i-built-a-kubernetes-cluster-so-my-coworkers-could-deploy-apps-faster-ad5567bf6fa8

5. Helm Stable Kubernetes Charts

    - Stable Deployments: https://github.com/kubernetes/charts/tree/master/stable
    - Install free helm cli and tiller engine (server): https://docs.helm.sh/using_helm/#installing-helm


### Credits to the authors of above links ! Thank you very much !

### And credits to the reader: Thanks for your visit !