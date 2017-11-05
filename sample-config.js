var config={};

config.home="/Users/mpierce/GeoGateway/";
config.bin=config.home+"/bin/";
config.baseDestDir="html/userUploads/";

config.uavsarSearchUrl='http://gf2.ucs.indiana.edu/quaketables/uavsar/search?';
config.wmsUrl='http://gw72.iu.xsede.org/geoserver/InSAR/wms?';
config.losQueryUrl='http://gf1.ucs.indiana.edu/insartool/profile?image=InSAR:uid';
config.altlosQueryUrl='http://156.56.177.220:5000/los/profile?image=uid';
config.wmscolorUrl = 'http://149.165.157.180/geoserver/InSAR/wms?';
config.sldserviceUrl = "http://gw88.iu.xsede.org/insar";
config.uavsarratingUrl = "http://gf2.ucs.indiana.edu/quaketables/uavsar/rating?";
config.gpsserviceUrl = "http://156.56.177.220:8000/gpsservice/kml?";

module.exports=config;
