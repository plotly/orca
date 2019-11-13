FROM ubuntu:bionic
ENV DISTRO bionic

RUN apt-get update && apt-get install -y --no-install-recommends \
        xvfb poppler-utils chromium-browser fonts-liberation gnupg curl ca-certificates xz-utils wget libgtk2.0-0 libgconf-2-4 \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

####################
# Install node
ENV NODE_VERSION node_8.x

RUN (curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key > /tmp/nodesource.gpg.key) \
    && apt-key add /tmp/nodesource.gpg.key \
    && (echo "deb https://deb.nodesource.com/$NODE_VERSION $DISTRO main" | tee /etc/apt/sources.list.d/nodesource.list) \
    && (echo "deb-src https://deb.nodesource.com/$NODE_VERSION $DISTRO main" | tee -a /etc/apt/sources.list.d/nodesource.list) \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* && apt-get clean

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

# From https://bugs.launchpad.net/ubuntu/+source/freetype/+bug/1722508/comments/36
# info about the interpreter-version: https://pandasauce.org/post/linux-fonts/
# RUN echo 'FREETYPE_PROPERTIES="truetype:interpreter-version=35 cff:no-stem-darkening=1 autofitter:warping=1"' >> /etc/environment

####################
# Download mathjax (same version as plotly.js extras/)

RUN curl -L https://github.com/plotly/plotly.js/archive/master.tar.gz \
    | tar -xvzf - --strip-components=3 plotly.js-master/dist/extras/mathjax

####################
# Copy and set up Orca

COPY package.json /var/www/image-exporter/
COPY bin /var/www/image-exporter/bin
COPY src /var/www/image-exporter/src

WORKDIR /var/www/image-exporter
RUN npm install && mkdir build

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
RUN apt-get update && apt-get install -y software-properties-common \
    && add-apt-repository -y ppa:inkscape.dev/stable \
    && apt-get update && apt-get install -y inkscape=0.92.4+68~ubuntu18.04.1 \
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
# Compile freetype 2.6.1

RUN apt-get update && apt-get install -y build-essential cmake git automake libtool autoconf \
    && rm -rf /var/lib/apt/lists/* && apt-get clean
RUN git clone https://git.savannah.nongnu.org/git/freetype/freetype2.git \
    && cd freetype2 && git checkout VER-2-6-1
COPY deployment/ftoption.h /var/www/image-exporter/freetype2/include/freetype/config/ftoption.h
RUN cd freetype2 && sh autogen.sh && ./configure && make && make install
RUN ln -s /etc/fonts/conf.avail/10-hinting.conf
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
