import {
  M3uPlaylist,
  M3uMedia,
  M3uAttributes,
  M3uDirectives,
  M3U_COMMENT,
} from "./m3u-playlist";

/**
 * M3u parser class to parse m3u playlist string to playlist object
 */
export class M3uParser {
  /**
   * Get m3u attributes object from attributes string
   * @param attributesString e.g. 'tvg-id="" group-title=""'
   * @param ignoreErrors ignore errors and try to
   * @returns attributes object e.g. {"tvg-id": "", "group-title": ""}
   * @private
   */
  private static getAttributes(
    attributesString: string,
    ignoreErrors: boolean
  ): M3uAttributes {
    const attributes: M3uAttributes = new M3uAttributes();
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
  private static processMedia(
    trackInformation: string,
    media: M3uMedia,
    ignoreErrors: boolean
  ): void {
    const lastCommaIndex = trackInformation.lastIndexOf(",");
    const durationAttributes = trackInformation.substring(0, lastCommaIndex);
    media.name = trackInformation.substring(lastCommaIndex + 1);

    const firstSpaceIndex = durationAttributes.indexOf(" ");
    const durationEndIndex =
      firstSpaceIndex > 0 ? firstSpaceIndex : durationAttributes.length;
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
  private static processDirective(
    item: string,
    playlist: M3uPlaylist,
    media: M3uMedia,
    ignoreErrors: boolean
  ): void {
    const directive = item.match(/^#[A-Z1-9]+/)?.[0];
    const trackInformation = item.substring(
      directive == null ? 0 : directive.length + 1
    );
    switch (directive) {
      case M3uDirectives.EXTM3U: {
        playlist.attributes = this.getAttributes(
          trackInformation,
          ignoreErrors
        );
        break;
      }
      case M3uDirectives.EXTINF: {
        this.processMedia(trackInformation, media, ignoreErrors);
        break;
      }
      case M3uDirectives.EXTGRP: {
        media.group = trackInformation;
        break;
      }
      case M3uDirectives.PLAYLIST: {
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
  private static getPlaylist(
    lines: string[],
    ignoreErrors: boolean
  ): M3uPlaylist {
    const playlist = new M3uPlaylist();
    let media = new M3uMedia("");
    lines.forEach((item) => {
      if (this.isDirective(item)) {
        this.processDirective(item, playlist, media, ignoreErrors);
      } else {
        media.location = item;
        playlist.medias.push(media);
        media = new M3uMedia("");
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
  private static isDirective(item: string): boolean {
    return item[0] === M3U_COMMENT;
  }

  /**
   * Is valid m3u method detect if first line of playlist contains #EXTM3U directive
   * @param firstLine - first line of m3u playlist string
   * @returns true if line starts with #EXTM3U, false otherwise
   * @private
   */
  private static isValidM3u(firstLine: string[]): boolean {
    return firstLine[0].startsWith(M3uDirectives.EXTM3U);
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
  static parse(m3uString: string, ignoreErrors = false): M3uPlaylist {
    if (!ignoreErrors && !m3uString) {
      throw new Error(`m3uString can't be null!`);
    }

    const lines = m3uString
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item != "");

    if (!ignoreErrors && !this.isValidM3u(lines)) {
      throw new Error(`Missing ${M3uDirectives.EXTM3U} directive!`);
    }
    return this.getPlaylist(lines, ignoreErrors);
  }
}
