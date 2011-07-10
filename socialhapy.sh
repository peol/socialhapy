#!/bin/bash
   
while true;
 do 
 
  echo starting $(date);

  script_directory=`dirname "$0"`;
  cd $script_directory;

  LOGFILE=socialhapy-$(date +"%b-%d-%y").log
  touch $LOGFILE
  node socialhapy.js $* >> $LOGFILE 2>&1;

  exit_value="$?" ;
  echo stopping $(date);
   
  if [ "$exit_value" != "0" ]; then 
   sleep 5;
  else 
   sleep 0.5;
  fi ;

 done;
