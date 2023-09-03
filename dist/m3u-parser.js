"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M3uParser = void 0;
const m3u_playlist_1 = require("./m3u-playlist");
/**
 * M3u parser class to parse m3u playlist string to playlist object
 */
class M3uParser {
    /**
     * Get m3u attributes object from attributes string
     * @param attributesString e.g. 'tvg-id="" group-title=""'
     * @param ignoreErrors ignore errors and try to
     * @returns attributes object e.g. {"tvg-id": "", "group-title": ""}
     * @private
     */
    static getAttributes(attributesString, ignoreErrors) {
        const attributes = new m3u_playlist_1.M3uAttributes();
        if (!attributesString) {
            return attributes;
        }
        const attributeValuePair = attributesString.split('" ');
        attributeValuePair.forEach((item) => {
            let [key, value] = item.split('="');
            if (!ignoreErrors && value == null) {
                throw new Error(`Attribute value can't be null!`);
            }
            key = key.trim();
            attributes[key] = value.replace('"', "");
        });
        return attributes;
    }
    /**
     * Process media method parse trackInformation and fill media with parsed info
     * @param trackInformation - media substring of m3u string line e.g. '-1 tvg-id="" group-title="",Tv Name'
     * @param media - actual m3u media object
     * @param ignoreErrors - ignore errors in file and try to parse it with it
     * @private
     */
    static processMedia(trackInformation, media, ignoreErrors) {
        const lastCommaIndex = trackInformation.lastIndexOf(",");
        const durationAttributes = trackInformation.substring(0, lastCommaIndex);
        media.name = trackInformation.substring(lastCommaIndex + 1);
        const firstSpaceIndex = durationAttributes.indexOf(" ");
        const durationEndIndex = firstSpaceIndex > 0 ? firstSpaceIndex : durationAttributes.length;
        media.duration = Number(durationAttributes.substring(0, durationEndIndex));
        const attributes = durationAttributes.substring(durationEndIndex + 1);
        media.attributes = this.getAttributes(attributes, ignoreErrors);
    }
    /**
     * Process directive method detects directive on line and call proper method to another processing
     * @param item - actual line of m3u playlist string e.g. '#EXTINF:-1 tvg-id="" group-title="",Tv Name'
     * @param playlist - m3u playlist object processed until now
     * @param media - actual m3u media object
     * @param ignoreErrors - ignore errors in file and try to parse it with it
     * @private
     */
    static processDirective(item, playlist, media, ignoreErrors) {
        var _a;
        const directive = (_a = item.match(/^#[A-Z1-9]+/)) === null || _a === void 0 ? void 0 : _a[0];
        const trackInformation = item.substring(directive == null ? 0 : directive.length + 1);
        switch (directive) {
            case m3u_playlist_1.M3uDirectives.EXTM3U: {
                playlist.attr = this.getAttributes(trackInformation, ignoreErrors);
                break;
            }
            case m3u_playlist_1.M3uDirectives.EXTINF: {
                this.processMedia(trackInformation, media, ignoreErrors);
                break;
            }
            case m3u_playlist_1.M3uDirectives.EXTGRP: {
                media.group = trackInformation;
                break;
            }
            case m3u_playlist_1.M3uDirectives.PLAYLIST: {
                playlist.title = trackInformation;
                break;
            }
        }
    }
    /**
     * Get playlist returns m3u playlist object parsed from m3u string lines
     * @param lines - m3u string lines
     * @param ignoreErrors - ignore errors in file and try to parse it with it
     * @returns parsed m3u playlist object
     * @private
     */
    static getPlaylist(lines, ignoreErrors) {
        const playlist = new m3u_playlist_1.M3uPlaylist();
        let media = new m3u_playlist_1.M3uMedia("");
        lines.forEach((item) => {
            if (this.isDirective(item)) {
                this.processDirective(item, playlist, media, ignoreErrors);
            }
            else {
                media.location = item;
                playlist.medias.push(media);
                media = new m3u_playlist_1.M3uMedia("");
            }
        });
        return playlist;
    }
    /**
     * Is directive method detect if line contains m3u directive
     * @param item - string line of playlist
     * @returns true if it is line with directive, otherwise false
     * @private
     */
    static isDirective(item) {
        return item[0] === m3u_playlist_1.M3U_COMMENT;
    }
    /**
     * Is valid m3u method detect if first line of playlist contains #EXTM3U directive
     * @param firstLine - first line of m3u playlist string
     * @returns true if line starts with #EXTM3U, false otherwise
     * @private
     */
    static isValidM3u(firstLine) {
        return firstLine[0].startsWith(m3u_playlist_1.M3uDirectives.EXTM3U);
    }
    /**
     * Parse is static method to parse m3u playlist string into m3u playlist object.
     * Playlist need to contain #EXTM3U directive on first line.
     * All lines are trimmed and blank ones are removed.
     * @param m3uString - whole m3u playlist string
     * @param ignoreErrors - ignore errors in file and try to parse it with it
     * @returns parsed m3u playlist object
     * @example
     * ```ts
     * const playlist = M3uParser.parse(m3uString);
     * playlist.medias.forEach(media => media.location);
     * ```
     */
    static parse(m3uString, ignoreErrors = false) {
        if (!ignoreErrors && !m3uString) {
            throw new Error(`m3uString can't be null!`);
        }
        const lines = m3uString
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item != "");
        if (!ignoreErrors && !this.isValidM3u(lines)) {
            throw new Error(`Missing ${m3u_playlist_1.M3uDirectives.EXTM3U} directive!`);
        }
        return this.getPlaylist(lines, ignoreErrors);
    }
}
exports.M3uParser = M3uParser;
