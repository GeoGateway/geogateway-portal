
"""
tiltmap_vis.py

    generate tiltmap visulization product

"""

import sys, string
import zipfile

try:
    import numpy as np 
    import matplotlib  as mpl
    import matplotlib.mlab as mlab 
    import matplotlib.pyplot as plt 
    #from matplotlib.backends.backend_agg import FigureCanvasAgg 
    import matplotlib.image as mpimg
except ImportError:
    sys.exit("Import matplotlib failed ")


def loadcsvdata(tiltmap_csv):
    """ load csv file 
        return data and [rowls,colums]
    """

    data = np.genfromtxt(tiltmap_csv, dtype=float, delimiter=',', names=True)

    #id,lat,lon,ux,uy,uz,horizDisp,horizDispAngle,slopePercnt,dnSlopeAngle,exx,exy,eyy,totalDisp,strainMag
    #print data.dtype.names

    # using unique value to fingure out cols and rows
    cols = np.unique(data['lon']).shape[0]
    rows = np.unique(data['lat']).shape[0]

    return [data, [rows,cols]]

def plot_image(imdata,imname,legendtitle,imdim):
    """ plot image with imshow """
    
    rows = imdim[0]
    cols = imdim[1]
    imdata = imdata.reshape(rows, cols)

    # using unique value to fingure out cols and rows

    fig = plt.figure(figsize=(rows/12.0,cols/12.0)) 
    # background transparency
    fig.patch.set_alpha(0.8)
    fig.subplots_adjust(left=0.0,bottom=0.0,top=1.0,right=1.0)
    # image transparency 
    im = plt.imshow(imdata,origin='lower',alpha=0.8) # interpolation='spline16' removed
    #plt.colorbar()
    plt.axis("off")
    #plt.show()
    plt.savefig(imname + ".png", format="PNG",aspect="auto",transparent=True,dpi=(96)) 
    
    plt.close(fig)

    # Make a figure and axes with dimensions as desired.
    fig = plt.figure(figsize=(1.4,4),frameon=True)
    ax1 = plt.subplot(111)
    fig.patch.set_alpha(0.85)
    fig.subplots_adjust(left=0.4,bottom=0.05,top=0.9,right=0.6)
    #ax1 = fig.add_axes([0.05, 0.80, 0.9, 0.15])
    # Set the colormap and norm to correspond to the data for which
    # the colorbar will be used.
    cmap = mpl.cm.jet
    minvalue = np.min(imdata)
    maxvalue = np.max(imdata)
 
    norm = mpl.colors.Normalize(vmin=minvalue, vmax=maxvalue)

    # ColorbarBase derives from ScalarMappable and puts a colorbar
    # in a specified axes, so it has everything needed for a
    # standalone colorbar.  There are many more kwargs, but the
    # following gives a basic continuous colorbar with ticks
    # and labels.
    cb1 = mpl.colorbar.ColorbarBase(ax1, cmap=cmap,
                                   norm=norm,
                                   orientation='vertical',alpha=0.85)
    # 'Strain Maginitude\nLog(microstrain)'
    plt.title(legendtitle,fontsize=10)
    plt.savefig(imname + "_legend.png", format="PNG",aspect="auto",transparent=False) # keep the white background

    plt.close(fig)

def plot_arrow(vectordata,imname,imdim):
    """ plot arrow plot """

    # plot slope direction
    rows = imdim[0]
    cols = imdim[1]
    fig = plt.figure(figsize=(rows/12.0,cols/12.0))
    fig.patch.set_alpha(0.0)
    fig.subplots_adjust(left=0.0,bottom=0.0,top=1.0,right=1.0)
    [X,Y,U,V] = vectordata
    if rows > 50 or cols > 50:
        #print "generate simple arrow plot"
        skip_p = int((rows*cols)/1000.0) 
        plt.quiver(X[::skip_p], Y[::skip_p], U[::skip_p], V[::skip_p],color='w')
    else:
        plt.quiver(X, Y, U, V,color='w')

    #plt.plot(X,Y,"bo")
    plt.axis('off')
    xup = np.unique(X)
    xstep = abs(xup[0] - xup[1])
    yup = np.unique(Y)
    ystep = abs(yup[0] - yup[1])
    plot_range = [np.min(X)-xstep,np.max(X)+xstep,np.min(Y)-ystep,np.max(Y)+ystep]
    plt.axis(plot_range)
    plt.savefig(imname + ".png", format="PNG",aspect="auto",transparent=False) # keep the white background

    plt.close(fig)

    return plot_range

def latlonbox(imrange):
    """ generate kml latlonbox """

    #<north>%s</north>
    #<south>%s</south>
    #<west>%s</west>
    #<east>%s</east>
    [lon0,lon1,lat0,lat1] = imrange

    north = "<north>%s</north>" % str(lat1)
    south = "<south>%s</south>" % str(lat0)
    west = "<west>%s</west>" % str(lon0)
    east = "<east>%s</east>" % str(lon1)

    return "".join([north,south,west,east])


def generate_kml(kmlname,kmltemplate,imagelist):
    """ generate kml file """

    # load kmltemplate
    with open(kmltemplate,"r") as f:
        kmlstr = f.read()
    f.close()

    if len(imagelist) > 1:
        extra_image = True
    else:
        extra_image = False

    imagename = imagelist[0]['name'] + ".png"
    extend = latlonbox(imagelist[0]['range'])
    legendname = imagelist[0]['name'] + "_legend.png"

    if extra_image:
        imname_arrow = imagelist[1]['name'] + ".png"
        extend_arrow = latlonbox(imagelist[0]['range'])
        kmlstr = kmlstr % (imagename,extend,imname_arrow, extend_arrow, legendname)
    else:
        kmlstr = kmlstr % (imagename,extend,legendname)
    
    kml = kmlname + ".kml"
    with open(kmlname + ".kml","w") as f:
        f.write(kmlstr)
    f.close

    kmz =kmlname + ".kmz"
    with zipfile.ZipFile(kmz,'w',zipfile.ZIP_DEFLATED) as myzip:
        myzip.write(kml)
        myzip.write("E-DECIDER_logo.png")
        myzip.write(imagename)
        myzip.write(legendname)
        if extra_image:
            myzip.write(imname_arrow)
    myzip.close


def tiltmap_product(tiltoutput, nameprefix):
    """ generate tilt map product """

    [data, imdim] = loadcsvdata(tiltoutput)

    #print imdim
 
    # default plot range
    X = data['lon']
    Y = data['lat']
    image_plot_range = [np.min(X),np.max(X),np.min(Y),np.max(Y)]

    # strainMag plot
    strainMag = np.log(data['strainMag'])
    imname = nameprefix + "_strainMag"
    plot_image(strainMag, imname, 'Strain Maginitude\nLog(microstrain)',imdim)

    # generate strainmag.kml
    kmlout = nameprefix + "_strainMag"
    kmltem = "strainmag_template.kml"
    imagelist = [{"name":imname,"range":image_plot_range}]
    generate_kml(kmlout,kmltem,imagelist)

    # slope plot
    slopePercent = data['slopePercnt']
    imname = nameprefix +'_slopePercent'
    plot_image(slopePercent, imname, 'Slope Percent\n 100% = 45 degrees',imdim)

    # arrow plot
    # anglevector = {{lon[[#]], lat[[#]]}, {Cos[(90 - dnslope[[#]]) Degree], Sin[(90 - dnslope[[#]]) Degree]}} & /@ Range[Length[newslope]];
    # update slopeangle to rad
    slopeangle = np.radians(90.0 - data['dnSlopeAngle'])
    U = np.cos(slopeangle)
    V = np.sin(slopeangle)
    imname_arrow = nameprefix + "_slopeAngle"
    arrow_plot_range = plot_arrow([X,Y,U,V],imname_arrow,imdim)

    # generate slope.kml
    kmlout = nameprefix + "_slope"
    kmltem = "slope_template.kml"
    imagelist = [{"name":imname,"range":image_plot_range}, {"name":imname_arrow,"range":arrow_plot_range}]
    generate_kml(kmlout,kmltem,imagelist)
 
 

def debug():
    """ testing functions """

    tiltmap_csv = "sample3.tilt.csv"
    nameprefix = "usc000m1w9_Scenario_1"
    tiltmap_product(tiltmap_csv,nameprefix)

if __name__ == '__main__':
    debug()