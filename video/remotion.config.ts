import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// Rendering heats the laptop; leave a couple of cores free.
Config.setConcurrency(Math.max(2, require('os').cpus().length - 2));
