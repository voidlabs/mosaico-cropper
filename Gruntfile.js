var path = require('path');

module.exports = function(grunt) {
  "use strict";
  require('load-grunt-tasks')(grunt);

  var pkg = grunt.file.readJSON("package.json");

  grunt.initConfig({

    pkg: pkg,

    pkgVersion: "<%= pkg.version %>",

    jshint: {
      lib: [
        'src/js/*.js',
      ],
      grunt: [
        'Gruntfile.js',
      ],
      options: {
        reporter: require('jshint-stylish'),
        sub: true,
        jshintrc: true,
      }
    },

    less: {
      options: {
        sourceMap: true,
        sourceMapRootpath: '../',
        sourceMapFileInline: true
      },
      css: {
        files: {
          "build/jqueryui-mosaico-cropper.css": "src/css/jqueryui-mosaico-cropper.less",
        }
      }
    },

    postcss: {
      options: {
        map: {
          inline: false /* , prev: 'build/app.css.map' */
        },
        diff: false,
        processors: [
          require('autoprefixer')({
            browsers: 'ie 10, last 2 versions'
          }),
          require('csswring')()
        ]
      },
      dist: {
        src: 'build/jqueryui-mosaico-cropper.css',
        dest: 'dist/jqueryui-mosaico-cropper.min.css'
      },
    },

    watch: {
      css: {
        files: ['src/css/*.less'],
        tasks: ['less', 'postcss']
      },
      web: {
        options: {
          livereload: true
        },
        files: ['dist/*', '*.html'],
      },
      jshint: {
        files: ['src/js/*.js', 'Gruntfile.js'],
        tasks: ['jshint']
      },
      js: {
        files: ['src/js/*.js'],
        tasks: ['uglify']
      },
      express: {
        files: [ 'backend/*.js', 'package.json' ],
        tasks: [ 'express:dev' ],
        options: {
          spawn: false // for grunt-contrib-watch v0.5.0+, "nospawn: true" for lower versions. Without this option specified express won't be reloaded
        }
      }
    },

    express: {
      dev: {
        options: {
          script: 'backend/main.js',
          background: true,
          port: 9009,
        }
      }
    },

    uglify: {
      main: {
        options: {
          comments: 'some',
          sourceMap: true,
          banner: '/*! <%= pkg.title %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' <%= pkg.license %> license */\n',
        },
        files: {
          'dist/jqueryui-mosaico-cropper.min.js': [
            'src/js/jqueryui-mosaico-cropper.js',
          ],
        }
      }
    },

    clean: {
      build: ['build/'],
      dist: ['dist/']
    },

    release: {
      options: {
        additionalFiles: ['package-lock.json'],
        tagName: 'v<%= version %>',
        // the release 0.14.0 plugin is buggy and they are all done BEFORE the tagging, so we stick to 0.13.1 until a new proper release is done.
        beforeRelease: ['clean', 'build'],
        afterRelease: ['compress'],
        npm: false,
        github: {
          repo: 'voidlabs/mosaico-cropper',
          accessTokenVar: 'GITHUB_ACCESS_TOKEN',
        }
      },
    },

  });

  grunt.registerTask('css', ['less', 'postcss']);
  grunt.registerTask('js', ['jshint', 'uglify']);
  grunt.registerTask('server', ['express', 'watch', 'keepalive']);
  grunt.registerTask('build', ['js', 'css']);
  grunt.registerTask('default', ['build', 'server']);

};