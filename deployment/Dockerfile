FROM ubuntu:xenial

####################
# Install node and dependencies
# From: https://github.com/nodejs/docker-node/blob/master/6.11/Dockerfile

RUN apt-get update && apt-get install -y --no-install-recommends \
        gnupg curl ca-certificates xz-utils wget libgtk2.0-0 libgconf-2-4 \
        libxss1 \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

# From https://github.com/nodejs/docker-node/blob/main/14/buster/Dockerfile
RUN groupadd --gid 1000 node \
&& useradd --uid 1000 --gid node --shell /bin/bash --create-home node

ENV NODE_VERSION 8.17.0

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  # gpg keys listed at https://github.com/nodejs/node#release-keys
  && set -ex \
  && for key in \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    74F12602B6F1C4E913FAA37AD3A89613643B6201 \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    B9E2F5981AA6E0CD28160D9FF13993A75599653C \
  ; do \
      # From https://github.com/nodejs/docker-node/issues/1500#issuecomment-865693819
      gpg --batch --keyserver hkp://keyserver.ubuntu.com --recv-keys "$key" || \
      gpg --batch --keyserver hkp://keys.openpgp.org --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version

####################
# Download fonts

RUN apt-get update -y && \
    apt-get install -y \
        fontconfig \
        fonts-ipafont-gothic \
        fonts-ipafont-mincho \
        subversion \
        && \
    rm -rf /var/lib/apt/lists/* && apt-get clean && \
    cd /usr/share/fonts/truetype && \
    for font in \
      https://github.com/google/fonts/trunk/apache/droidsansmono \
      https://github.com/google/fonts/trunk/apache/droidsans \
      https://github.com/google/fonts/trunk/apache/droidserif \
      https://github.com/google/fonts/trunk/apache/roboto \
      https://github.com/google/fonts/trunk/apache/opensans \
      https://github.com/google/fonts/trunk/ofl/gravitasone \
      https://github.com/google/fonts/trunk/ofl/oldstandardtt \
      https://github.com/google/fonts/trunk/ofl/ptsansnarrow \
      https://github.com/google/fonts/trunk/ofl/raleway \
      https://github.com/google/fonts/trunk/ofl/overpass \
    ; do \
      svn checkout $font ; \
    done && \
    mkdir /usr/share/fonts/user && \
    fc-cache -fv && apt-get --auto-remove -y remove subversion

####################
# Download mathjax (same version as plotly.js extras/)

RUN mkdir /mathjax && cd /mathjax && \
    curl -L https://github.com/mathjax/MathJax/archive/2.3.0.tar.gz \
    | tar -xvzf - --strip-components=2 MathJax-2.3.0/unpacked

####################
# Install and configure monit
COPY deployment/monitrc /etc
RUN cd /opt && \
    wget -q -O - https://mmonit.com/monit/dist/binary/5.25.1/monit-5.25.1-linux-x64.tar.gz | \
        tar xvzf - && \
    ln -s monit-* monit && \
    chmod 600 /etc/monitrc

####################
# Install latest stable Inkscape
RUN apt-get update && apt-get install -y software-properties-common python-software-properties \
    && add-apt-repository -y ppa:inkscape.dev/stable \
    && apt-get update && apt-get install -y inkscape=0.92.5+68~ubuntu16.04.1 \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

# Copy Inkscape defaults
COPY deployment/preferences.xml /root/.config/inkscape/

####################
# Download geo-assets (same version as plotly.js extras/)

RUN wget https://raw.githubusercontent.com/plotly/plotly.js/master/dist/plotly-geo-assets.js -O /plotly-geo-assets.js

####################
# Configure ImageMagick policy

COPY deployment/ImageMagickPolicy.xml /etc/ImageMagick-6/policy.xml

####################
# Copy and set up Orca

RUN apt-get update && apt-get install -y chromium-browser fonts-liberation xvfb poppler-utils git libxss1 \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

COPY package.json /var/www/image-exporter/
COPY package-lock.json /var/www/image-exporter/
WORKDIR /var/www/image-exporter
RUN npm install && mkdir build
COPY bin /var/www/image-exporter/bin
COPY src /var/www/image-exporter/src

####################
# Add entrypoint script
COPY deployment/entrypoint.sh /
# Add server script
COPY deployment/run_server /
# Symlink to entrypoint
RUN ln -s /entrypoint.sh /usr/bin/orca

EXPOSE 9091
ENTRYPOINT ["/entrypoint.sh"]
CMD ["--mathjax", "/mathjax/MathJax.js", "--topojson", "/plotly-geo-assets.js"]
