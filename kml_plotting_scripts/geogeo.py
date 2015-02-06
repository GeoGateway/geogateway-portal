from geofunc import *
class Coord:
    """
    Coord is a lon, lat pair.
    """
    def __init__(self,lon,lat):
        self.lon=float(lon)
        self.lat=float(lat)

class RCoord:
    """
    RCoord is an x,y pair.
    """
    def __init__(self,x,y):
        self.x=float(x)
        self.y=float(y)

class Box:
    """ 
    Box is a range of x, y and z, 
    suitable for the bounding box of a finite element problem as in GeoFEST
    """
    def __init__(self,xmin, ymin, zmin, xmax, ymax, zmax):
        self.xmin=float(xmin)
        self.ymin=float(ymin)
        self.zmin=float(zmin)
        self.xmax=float(xmax)
        self.ymax=float(ymax)
        self.zmax=float(zmax)

class Segment:
    """
    Segment is a line segment
    defined similar to a Fault
    """
    def __init__(self, x0, y0, depth, strike, dip, length, name):
         self.x0=float(x0)
         self.y0=float(y0)
         self.depth=float(depth)
         self.strike=float(strike)
         self.dip=float(dip)
         self.length=float(length)
         self.z0 = -float(depth)
         self.name = name

class Layer:
    """ 
    Layer is a range of z and properties, 
    which together with Box is suitable for a geological layer 
    of a finite element problem as in GeoFEST
    """
    def __init__(self, zmin, zmax, rho,mu,lam, visc, exp, name):
        self.zmin=float(zmin)
        self.zmax=float(zmax)
        self.rho=float(rho)
        self.mu=float(mu)
        self.lam=float(lam)
        self.visc=float(visc)
        self.exp=float(exp)
        self.name = name
    def write_lyr(self,fn,box):
        fp=open(fn, "w")
        fp.write("8\n")
        fp.write("%e %e %e\n"%(box.xmin,box.ymin,self.zmax))
        fp.write("%e %e %e\n"%(box.xmax,box.ymin,self.zmax))
        fp.write("%e %e %e\n"%(box.xmax,box.ymax,self.zmax))
        fp.write("%e %e %e\n"%(box.xmin,box.ymax,self.zmax))
        fp.write("%e %e %e\n"%(box.xmin,box.ymin,self.zmin))
        fp.write("%e %e %e\n"%(box.xmax,box.ymin,self.zmin))
        fp.write("%e %e %e\n"%(box.xmax,box.ymax,self.zmin))
        fp.write("%e %e %e\n"%(box.xmin,box.ymax,self.zmin))
        fp.write("6\n")
        fp.write("0 1\n         4 1 2 3 4\n")
        fp.write("0 1\n         4 1 2 6 5\n")
        fp.write("0 1\n         4 2 3 7 6\n")
        fp.write("0 1\n         4 3 4 8 7\n")
        fp.write("0 1\n         4 4 1 5 8\n")
        fp.write("0 1\n         4 5 6 7 8\n")
        fp.close()


class Fault:
    """ 
    Fault is a rectangular fault plane using the Okada conventions:
    the origin is at x0, y0, -depth;
    the strike is the compass bearing along which the fault extends "length"
    the dip is degrees upward from horizontal, the fault extends "width"
    the slip is not specified at present (might be in a "Slip()" object?)
    """
    def __init__(self, x0=0, y0=0, depth=1, strike=0, dip=90, length=0,
             width=0,name='default', first=0):
        self.x0=float(x0)
        self.y0=float(y0)
        self.depth=float(depth)
        self.strike=float(strike)
        self.dip=float(dip)
        self.length=float(length)
        self.width=float(width)
        self.z0 = -float(depth)
        self.name = name
        self.first = float(first)
        l = self.length
        self.svec = [l*sino(self.strike),
                l*coso(self.strike),
                0.0]
        w = self.width
        self.dvec = [-w*coso(self.strike)*coso(self.dip),
                  w*sino(self.strike)*coso(self.dip),
                  w*sino(self.dip)]
    def print_vec(self):
        print 'svec %f, %f, %f'%(self.svec[0],self.svec[1],self.svec[2])
        print 'dvec %f, %f, %f'%(self.dvec[0],self.dvec[1],self.dvec[2])
    def print_flt(self):
         print "Fault %s x0: %f"%(self.name,self.x0)
         print "Fault %s y0: %f"%(self.name,self.y0)
         print "Fault %s z0: %f"%(self.name,self.z0)
         print "Fault %s depth: %f"%(self.name,self.depth)
         print "Fault %s strike: %f"%(self.name,self.strike)
         print "Fault %s dip: %f"%(self.name,self.dip)
         print "Fault %s length: %f"%(self.name,self.length)
         print "Fault %s width: %f"%(self.name,self.width)
         print "Fault %s first: %f"%(self.name,self.first)
    def read_flt(self,fname):
         fp=open(fname,"r")
         if fp==None: print "no file named " +fname; exit(1)
         line=fp.readline()
         if(line != '4 \n' and line != '4\n'):
              print "this doesn't look like a fault file!: "+line
              exit(1)
         line=fp.readline()
         co = line.split()
         if len(co) != 3: 
             print "trouble!"+line
             exit(1)
         self.x0 = float(co[0])
         self.y0 = float(co[1])
         self.z0 = float(co[2])
         self.depth = -self.z0
         line = fp.readline()
         co = line.split()
         if len(co) != 3: 
             print "trouble!"+line
             exit(1)
         svec = [float(co[0])-self.x0,float(co[1])-self.y0,float(co[2])-self.z0]
         self.svec = svec
         self.strike = atan2o(svec[0],svec[1])
         self.length = math.sqrt(svec[0]*svec[0] + svec[1]*svec[1])
         fp.readline() # don't really need third line
         line = fp.readline()
         co = line.split()
         if len(co) != 3: 
             print "trouble!"+line
             exit(1)
         dvec = [float(co[0])-self.x0,float(co[1])-self.y0,float(co[2])-self.z0]
         self.dvec = dvec
         drho = math.sqrt(dvec[0]*dvec[0]+dvec[1]*dvec[1])
         self.dip = atan2o(dvec[2],drho)

         self.width = math.sqrt(drho*drho+dvec[2]*dvec[2])
         fp.close()
    def write_params(self,fname):
         fp=open(fname,'w')
         fp.write( "number  dip(o)  strike(o)       slip(m) rake(o) length(km)      width(km)      depth(km) origX origY 1st repeat\n")
         fp.write ("%f %f %f %f %f %f %f %f %f %f %f %f\n" % (1,
                 self.dip,self.strike,1.0, 180,self.length, self.width,
                 self.depth, self.x0, self.y0, self.first, 5000.))
         fp.close()

    def write_flt(self,fname):
         fp=open(fname,"w")
         if fp==None: print "cannot open file " +fname; exit(1)
         fp.write('4 \n')
         p0=[self.x0,self.y0,self.z0]
         l = self.length
         svec = [l*sino(self.strike),
                 l*coso(self.strike),
                 0.0]
         p1=[self.x0+svec[0],self.y0+svec[1],self.z0]
         w = self.width
         dvec = [-w*coso(self.strike)*coso(self.dip),
                  w*sino(self.strike)*coso(self.dip),
                  w*sino(self.dip)]
         p3=[self.x0+dvec[0],self.y0+dvec[1],self.z0+dvec[2]]
         p2=[p1[0]+dvec[0],p1[1]+dvec[1],p1[2]+dvec[2]]
#####Alter this to fix format problem: want 6 digits but also need
# rectangles to be rectangles (coplanar).  Thus need p1-p0=p2-p3
# for x and y coords, after truncation.
# let's try making the needed correction and see if it's adequate.
         c3x = p2[0]+p0[0]-p1[0]-p3[0]
         c3y = p2[1]+p0[1]-p1[1]-p3[1]
         print "corrections: %e, %e\n"%(c3x,c3y)
# want new p3' such that p2+p0-p1-p3' = 0
# so if p3'=p3+c3 then above is p2+p0-p1-p3-c3
# is p2+p0-p1-p3-(p2+p0-p1-p3) - so that's certainly 0.
         p3[0] += c3x
         p3[1] += c3y
         fp.write("%g %g %g\n"%(p0[0],p0[1],p0[2]))
         fp.write("%g %g %g\n"%(p1[0],p1[1],p1[2]))
         fp.write("%g %g %g\n"%(p2[0],p2[1],p2[2]))
         fp.write("%g %g %g\n"%(p3[0],p3[1],p3[2]))
         fp.close()
    def check_flt(self,fname):
         fp=open(fname,"r")
         fp.readline()
         p0=fp.readline().split()
         p1=fp.readline().split()
         p2=fp.readline().split()
         p3=fp.readline().split()
         c3x = float(p2[0])+float(p0[0])-float(p1[0])-float(p3[0])
         c3y = float(p2[1])+float(p0[1])-float(p1[1])-float(p3[1])
         print "revised corrections: %e, %e\n"%(c3x,c3y)
         fp.close()

class VCFault:
    """ 
    VCFault is a collection of the named items in a VC fault file.
    """
    def __init__(self, lower_depth_boundary=15, upper_depth_boundary=0, 
     long_west_endpoint=0, lat_west_endpoint=0,
     long_east_endpoint=0, lat_east_endpoint=0,
             slip_rate=0,fraction_coseismic=0, one_more_number=0,n1=0,n2=0,
             length = 0,vertdepth = 0):
        self.lower_depth_boundary=float(lower_depth_boundary)
        self.upper_depth_boundary=float(upper_depth_boundary)
        self.long_west_endpoint=float(long_west_endpoint)
        self.lat_west_endpoint=float(lat_west_endpoint)
        self.long_east_endpoint=float(long_east_endpoint)
        self.lat_east_endpoint=float(lat_east_endpoint)
        self.slip_rate=float(slip_rate)
        self.fraction_coseismic=float(fraction_coseismic)
        self.one_more_number=float(one_more_number)
        self.n1 = n1
        self.n2 = n2
        dlong = self.long_east_endpoint - self.long_west_endpoint
        dlat = self.lat_east_endpoint - self.lat_west_endpoint
        reflat = 0.5*(self.lat_east_endpoint + self.lat_west_endpoint)
        klat = 111.32
        klong = 111.32*coso(reflat)
        self.length = math.sqrt(dlong*dlong*klong*klong+dlat*dlat*klat*klat)
        self.klat = klat
        self.klong = klong
        self.vertdepth = self.lower_depth_boundary-self.upper_depth_boundary
        
class LockedInfFault:
    """ 
    LockedInfFault is a simple representation of an infinite-length
    fault moving at constant rate below a fixed depth. Can be expanded
    to use traditional fault definition flexibility; for now assume
    fault is strike 90, passing thru origin.
    """
    def __init__(self, upper_depth_boundary=15, 
             slip_rate=1):
        self.upper_depth_boundary=float(upper_depth_boundary)
        self.slip_rate=float(slip_rate)
    def displ(self,x):
        y=x[1]
        u=(1./math.pi)*math.atan(y/self.upper_depth_boundary)
        v=0.
        return [u,v]

class QTFault:
    """ 
    QTFault is a rectangular fault plane using the Okada conventions
    and also including the qtset (QuakeTables) named entities
    the origin is at x0, y0, -depth;
    the strike is the compass bearing along which the fault extends "length"
    the dip is degrees upward from horizontal, the fault extends "width"
    the slip is not specified at present (might be in a "Slip()" object?)
    """
    def __init__(self, FaultID=0,SegmentID=0,FaultName="", SegmentName="",
     StrandName="",LatStart=0.0, LatEnd=0.0, LonStart=0.0, LonEnd=0.0, 
     Strike=0.0, Dip=0.0, DepthTop=0.0, DepthBottom=0.0, Width=0.0, 
     FaultBreak=[], Friction=0.0, RecurrenceInterval=0.0,Slip=0.0, 
     DipSlip=0.0, StrikeSlip=0.0, DipRate=0.0, StrikeRate=0.0, Geometry="", 
     Length=0.0, CharacteristicRate=0.0, Rake=0.0, Datum=""):
        self.FaultID = FaultID
        self.SegmentID = SegmentID
        self.FaultName=FaultName
        self.SegmentName=SegmentName
        self.StrandName=StrandName
        self.LatStart=float(LatStart)
        self.LatEnd=float(LatEnd)
        self.LonStart=float(LonStart)
        self.LonEnd=float(LonEnd)
        self.Strike=float(Strike)
        self.Dip=float(Dip)
        self.DepthTop=float(DepthTop)
        self.DepthBottom=float(DepthBottom)
        self.Width=float(Width)
        self.FaultBreak=FaultBreak
        self.Friction=float(Friction)
        self.RecurrenceInterval=float(RecurrenceInterval)
        self.Slip = float(Slip)
        self.DipSlip = float(DipSlip)
        self.StrikeSlip = float(StrikeSlip)
        self.DipRate = float(DipRate)
        self.StrikeRate=float(StrikeRate)
        self.Geometry = Geometry
        self.Length = float(Length)
        self.CharacteristicRate = float(CharacteristicRate)
        self.Rake = float(Rake)
        self.Datum = Datum

    def print_flt(self):
         print "QTFault %s LatStart: %f"%(self.FaultName,self.LatStart)
         print "QTFault %s LatEnd: %f"%(self.FaultName,self.LatEnd)
         print "QTFault %s LonStart: %f"%(self.FaultName,self.LonStart)
         print "QTFault %s LonEnd: %f"%(self.FaultName,self.LonEnd)
         print "QTFault %s Strike: %f"%(self.FaultName,self.Strike)
         print "QTFault %s Dip: %f"%(self.FaultName,self.Dip)
         print "QTFault %s DepthTop: %f"%(self.FaultName,self.DepthTop)
         print "QTFault %s DepthBottom: %f"%(self.FaultName,self.DepthBottom)
         print "QTFault %s Width: %f"%(self.FaultName,self.Width)
         print "QTFault %s Length: %f"%(self.FaultName,self.Length)
