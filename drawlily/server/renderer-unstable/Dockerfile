# syntax=docker/dockerfile:1.6
# Multi-stage build of LilyPond 2.27.1 from source. Works on both
# linux/amd64 and linux/arm64 since LilyPond publishes no upstream
# linux-arm64 binary. Drops the previous lyp/lys dependency entirely;
# the in-process Scheme render server lives in lily-server.scm.

#---------------------------------------------------------------------
# Stage 1: build LilyPond from source.
#---------------------------------------------------------------------
FROM debian:sid-slim AS builder

ARG LILYPOND_VERSION=2.27.1
ARG LILYPOND_TARBALL_URL=https://gitlab.com/lilypond/lilypond/-/releases/v${LILYPOND_VERSION}/downloads/lilypond-${LILYPOND_VERSION}.tar.gz
# Pinned checksum of the lilypond-2.27.1 release tarball. The build
# verifies this unconditionally (fail-closed); override it when bumping
# LILYPOND_VERSION. Leaving it blank now fails the build rather than
# silently compiling an unverified download.
ARG LILYPOND_TARBALL_SHA256=ab81ac451ee247db3af0980bef6d87834647fd90ad04e1d98730f1bfd285d393
