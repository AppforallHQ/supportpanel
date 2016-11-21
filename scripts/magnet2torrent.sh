#!/bin/bash
watch_folder=$2 # ~/.rtorrent/watch

[[ "$1" =~ xt=urn:btih:([^&/]+) ]] || exit;
# echo "d10:magnet-uri${#1}:${1}e" > "meta-${BASH_REMATCH[1]}.torrent"
echo "d10:magnet-uri${#1}:${1}e" | ssh srv05-requests -p 22022 "cat > /home/user/torrent/meta-${BASH_REMATCH[1]}.torrent"
