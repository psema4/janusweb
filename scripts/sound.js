elation.require(['janusweb.janusbase'], function() {
  var soundcache = {};

  elation.component.add('engine.things.janussound', function() {
    this.postinit = function() {
      elation.engine.things.janussound.extendclass.postinit.call(this);
      this.defineProperties({
        sound_id: { type: 'string', set: this.updateSound },
        loop: { type: 'boolean', default: false },
        auto_play: { type: 'boolean', default: false },
        play_once: { type: 'boolean', default: false },
        dist: { type: 'float', default: 1.0 },
        pitch: { type: 'float', default: 1.0, set: this.updateSound },
        gain: { type: 'float', default: 1.0, set: this.updateSound },
        starttime: { type: 'float', default: 0.0, set: this.updateSound },
        rect: { type: 'string', set: this.updateSound }
      });
      Object.defineProperty(this, 'playing', { get: function() { if (this.audio) return this.audio.isPlaying; return false; } });
      this.playStarted = false;
      elation.events.add(this.room, 'janusweb_script_frame', elation.bind(this, this.checkBounds));
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.createChildren = function() {
      if (!this.audio) {
        this.createAudio();
      }
    }
    this.createAudio = function(src) {
      if (!src) {
        this.currentsound = this.sound_id;
        var sound = this.getAsset('sound', this.sound_id); //elation.engine.assets.find('sound', this.sound_id);
        if (sound) {
          src = sound.getProxiedURL(sound.src);
        }
      }
      if (this.audio) {
        if (this.audio.isPlaying) {
          this.audio.stop();
        }
        this.objects['3d'].remove(this.audio);
      }
      var listener = this.engine.systems.sound.getRealListener();
      if (listener) {
        if (!this.hasposition) {
          this.audio = new THREE.Audio(listener);
        } else {
          this.audio = new THREE.PositionalAudio(listener);
          if (this.properties.distanceModel) {
            this.audio.panner.distanceModel = this.properties.distanceModel;
          }
          //this.audio.panner.maxDistance = this.properties.distance;
          if (this.dist) {
            this.audio.setRefDistance(this.dist);
          } else {
            //this.audio.panner.distanceModel = 'linear';
          }
        }
        this.audio.autoplay = this.auto_play || this.playStarted;
        this.audio.setLoop(this.loop);
        this.audio.setVolume(this.gain);
        this.audio.setPlaybackRate(this.pitch);
        if (src) {
          if (soundcache[src]) {
            this.audio.setBuffer(soundcache[src]);
            if (this.auto_play || this.playStarted) {
              this.play();
            }
          } else {
            var loader = new THREE.AudioLoader();
            loader.load(src, elation.bind(this, function(buffer) {
              if (buffer) {
                soundcache[src] = buffer;
                this.audio.setBuffer(buffer);
                if (this.auto_play || this.playStarted) {
                  this.play();
                }
              }
            }));
          }
        } else {
        }
        this.objects['3d'].add(this.audio);
      }
      this.updateSound();
    }
    this.load = function(url) {
      this.src = url;
      if (this.audio.isPlaying) {
        this.audio.stop();
      }
      this.createAudio(url);
    }
    this.play = function() {
      this.playStarted = true;
      if (this.audio && this.audio.buffer) { //this.audio.source && this.audio.source.buffer) {
        this.audio.setVolume(this.gain);
        if (this.audio.isPlaying) {
          this.audio.source.currentTime = 0;
        } else {
          this.seek(this.starttime);
          this.audio.play();
        }
      }
    }
    this.pause = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.pause();
      }
    }
    this.start = function() {
      if (this.auto_play || this.playStarted) {
        this.play();
      }
    }
    this.seek = function(time) {
      this.audio.currentTime = time;
    }
    this.stop = function() {
      if (this.audio && this.audio.isPlaying) {
        this.audio.stop();
      }
    }
    this.updateSound = function() {
      if (!this.objects['3d']) return;
      if (this.currentsound != this.sound_id) {
        this.createAudio();
      }
      if (this.audio) {
        //this.play();
        this.audio.setVolume(this.gain);
        this.audio.setPlaybackRate(this.pitch);
      }
      if (this.rect) {
        var parts = this.rect.split(' ');
        this.bounds = new THREE.Box3(new THREE.Vector3(parts[0], -Infinity, parts[1]), new THREE.Vector3(parts[2], Infinity, parts[3]));
      } else {
        this.bounds = false;
      }
    }
    this.checkBounds = (function() {
      var worldpos = new THREE.Vector3();
      return function() {
        if (this.bounds && this.audio && !this.playing) {
          var listener = this.engine.systems.sound.getRealListener();
          if (listener) {
            worldpos.set(0,0,0).applyMatrix4(listener.matrixWorld);
          }
          if (this.bounds.containsPoint(worldpos)) {
            this.play();
          }
        }
      }
    })();
    this.getProxyObject = function(classdef) {
      if (!this._proxyobject) {
        this._proxyobject = elation.engine.things.janussound.extendclass.getProxyObject.call(this, classdef);
        this._proxyobject._proxydefs = {
          id:           [ 'property', 'sound_id'],
          gain:         [ 'property', 'gain'],
          pitch:        [ 'property', 'pitch'],
          auto_play:    [ 'property', 'auto_play'],
          playing:      [ 'property', 'playing'],
          play:         [ 'function', 'play'],
          pause:        [ 'function', 'pause'],
          stop:         [ 'function', 'stop'],
          seek:         [ 'function', 'seek'],
        };
      }
      return this._proxyobject;
    }
  }, elation.engine.things.janusbase);
});
