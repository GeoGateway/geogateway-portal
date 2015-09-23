var config={};

config.home="/Users/mpierce/GeoGateway/";
config.bin=config.home+"/bin/";
config.baseDestDir="html/userUploads/";

config.uavsarSearchUrl='http://gf2.ucs.indiana.edu/quaketables/uavsar/search?';
config.wmsUrl='http://gw72.iu.xsede.org:8080/geoserver/InSAR/wms?';
config.losQueryUrl='http://gf1.ucs.indiana.edu/insartool/profile?image=InSAR:uid';

module.exports=config;
