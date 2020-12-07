var config={};

config.home="/home/webgisdeveloper/github/geogateway-portal/";
config.bin=config.home+"/bin/";
config.baseDestDir="html/userUploads/";

config.wmsUrl='http://js-157-39.jetstream-cloud.org/geoserver/highres/wms?';
config.losQueryUrl='http://gf1.ucs.indiana.edu/insartool/profile?image=InSAR:uid';
//config.altlosQueryUrl='http://156.56.177.220:5000/los/profile?image=uid';
config.altlosQueryUrl='http://js-157-58.jetstream-cloud.org:8000/los/profile?image=uid';
config.wmscolorUrl = 'http://js-157-39.jetstream-cloud.org/geoserver/InSAR/wms?';
//config.sldserviceUrl = "http://149.165.168.89/insar";
config.sldserviceUrl = "http://js-157-39.jetstream-cloud.org/insar";

//config.uavsarSearchUrl='http://localhost/quaketables/uavsar/search?';
//config.uavsarratingUrl = "http://localhost/quaketables/uavsar/rating?";
config.uavsarSearchUrl='http://gf2.ucs.indiana.edu/quaketables/uavsar/search?';
config.uavsarratingUrl = "http://gf2.ucs.indiana.edu/quaketables/uavsar/rating?";
config.gpsserviceUrl = "http://156.56.174.162:8000/gpsservice/kml?";
config.seismicityplotUrl = "http://gf8.ucs.indiana.edu:8000/seismicityservice/plot?"


module.exports=config;
