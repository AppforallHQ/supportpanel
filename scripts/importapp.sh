#!/bin/bash

WDIR=$1
IMPORTER="importer/importer.py"
PYTHON=".virtualenv/bin/python"

chown -R user:user $WDIR
su - user -c "$PYTHON $IMPORTER --full-ipa-import $WDIR && rm -r $WDIR"
