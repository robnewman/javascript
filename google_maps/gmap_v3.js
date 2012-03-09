//<![CDATA[
/**
 * @name         gmap_v3.js
 * @author       Rob Newman <robertlnewman@gmail.com> 858.822.1333
 * @modified     2012-03-08
 * @license      MIT-style license
 * @dependencies (1) jQuery
 *               (2) Google Maps API v3
 *               (3) MarkerWithLabel for V3
 * @notes        Made a local copy of MarkerWithLabel in
 *               /js/deployments/ due to flaky Google Code server
 *               Uses new tabbed jQueryUI interface
 */
var iconDiv;
var sta_status={'online':0,'total':0}, sta_arr=[];
var status_icon_opts = {
    'ok':['online', '&lt; 30mins'],
    'warning':['warning', '&gt; 30mins'],
    'down':['offline','&gt; 4hrs']
};
/** Just define the
 * object keys once then
 * loop over it multiple
 * times to generate
 * holder Arrays & Objects
 */
var sta_obj={
    'network':{},
    'comms_type':{},
    'comms_provider':{},
    'datalogger':{},
    'sensor':{}
};
/**
 * Generator loop
 */
var types=[], style_obj={}, latency_obj={};
for(t in sta_obj) {
    types.push(t);
    style_obj[t] = {}
}
var statusDiv='#status', statusAlertDiv='#statusalert';
var iconPath = '/images/deployments/deployment_icons/';
var tabDiv='div#tabs', nrecsSpan='span#nrecs';
var markerArray = [];

// {{{ Date related
var myDate = new Date() ;
var myDateYear = myDate.getFullYear() ;
var myDateMonth = myDate.getMonth() + 1 ;
if(myDateMonth.toString().length < 2) {
    myDateMonth = '0'+myDateMonth.toString();
}
var myDateDay = myDate.getDate() ;
if(myDateDay.toString().length < 2) {
    myDateDay = '0'+myDateDay.toString();
}
var myDateStr = myDateYear+'-'+myDateMonth+'-'+myDateDay ;
// }}} Date related

// {{{ Custom Marker Group Display & Control Object
DisplayTypeControl.prototype.type_ = null;
DisplayTypeControl.prototype.getType = function() {
    /**
     * Return the marker
     * type selected
     */
    return this.type_;
}
DisplayTypeControl.prototype.setType = function(t) {
    /**
     * Set the symbols
     * to display on the map
     */
    $(this.controller).find('p').removeClass('googleTxtBold');
    $(this.controller).find('p[id="'+t+'"]').addClass('googleTxtBold');
    this.type_ = t;
    for(i in this.markerArr) {
        var info = this.markerArr[i]['info'];
        if(t == 'network') {
            this.markerArr[i].set('icon', info[t]);
        } else {
            this.markerArr[i].set('icon', iconPath+t+'_'+info[t]+'.gif');
        }
    }
}
DisplayTypeControl.prototype.updateLegend = function(t) {
    /**
     * Update the legend
     * based on the style
     */
    var legendStyle=[], thisStyle=this.styleObj[t];
    var extra_status = {'warning':'Latency &gt; 30 mins', 'down':'Latency &gt; 4 hrs'};
    $.each(thisStyle, function(text, css) {
        legendStyle.push('<tr>');
        legendStyle.push('<td>');
        legendStyle.push('<img src="'+iconPath+t+'_'+css+'.gif" align="absmiddle" />');
        legendStyle.push('</td>');
        legendStyle.push('<td style="vertical-align:middle">');
        legendStyle.push(text);
        legendStyle.push('</td>');
        legendStyle.push('</tr>');
    });
    if(t == 'network') {
        $.each(extra_status, function(i, text) {
            legendStyle.push('<tr>');
            legendStyle.push('<td>');
            legendStyle.push('<img src="'+iconPath+t+'_AZ_'+i+'.gif" align="absmiddle" />');
            legendStyle.push('</td>');
            legendStyle.push('<td style="vertical-align:middle">');
            legendStyle.push('AZ ['+text+']');
            legendStyle.push('</td>');
        });
    }
    $(iconDiv).find('table').html(legendStyle.join(''));
}
function DisplayTypeControl(map, div, types, markerArr, style_obj, tab_div) {
    /**
     * New object to display 
     * and control the
     * custom GMap tab selector
     */
    var typeDiv = div;
    this.markerArr = markerArr;
    this.styleObj = style_obj;

    /**
     * Create the 
     * DOM element 
     */
    var tabDivUI = document.createElement('DIV');
    tabDivUI.className = 'googleCustomControl';
    tabDivUI.id = 'googleOverlayOpts';
    typeDiv.appendChild(tabDivUI);

    /**
     * Assign the controller
     */
    this.controller = tabDivUI;

    /**
     * New instance of object
     * to handle functionality
     */
    var control = this;

    /**
     * Bind to the tab 
     * select event handler
     * Use the forced 'rel'
     * attribute. HACK - how
     * do I grab the contents
     * of the tab itself?
     */
    $(tab_div).tabs({
        select: function(event, ui) {
            control.setType($(ui.tab).text());
            control.updateLegend($(ui.tab).text());
        }
    });

    /**
     * Loop over each marker
     * type and bind event 
     * listener to the 
     * Google map dynamic menu 
     */
    $.each(types, function(i, t) {
        var tabDivText = document.createElement('P');
        tabDivText.innerHTML = t.toUpperCase();
        tabDivText.id = t;
        tabDivUI.appendChild(tabDivText);
        google.maps.event.addDomListener(tabDivText, 'click', function() {
            control.setType(t);
            control.updateLegend(t);
            $(tab_div).tabs('select', 'tabs-'+t);
        });
    });

    /**
     * Initial state
     */
    if($(tabDivUI).find('p[class="googleTxtBold"]').length == 0){
        control.setType('network');
        control.updateLegend('network');
    }
}
// }}}

// {{{ Date object
var myDate = new Date() ;
var myDateYear = myDate.getFullYear() ;
var myDateMonth = myDate.getMonth() + 1 ;
if(myDateMonth.toString().length < 2) {
    myDateMonth = '0'+myDateMonth.toString();
}
var myDateDay = myDate.getDate() ;
if(myDateDay.toString().length < 2) {
    myDateDay = '0'+myDateDay.toString();
}
var myDateStr = myDateYear+'-'+myDateMonth+'-'+myDateDay ;
// }}} Date object

function parseSensor(sensor_vals) {
    // {{{ parseSensor
    var comp, cssclass;
    if(Object.prototype.toString.call(sensor_vals) === '[object Array]') {
        var comp_arr = [];
        var style_arr = [];
        for(var i=0;i<sensor_vals.length;i++) {
            comp_arr.push(sensor_vals[i].value)
            style_arr.push(sensor_vals[i].css)
        }
        comp_arr.sort();
        style_arr.sort();
        comp = comp_arr.join(' &amp; ');
        cssclass = style_arr.join('_');
    } else {
        comp = sensor_vals.value;
        cssclass = sensor_vals.css;
    }
    return [comp, cssclass]; 
    // }}}
}
function loadNetwork(sta_file, snet, netstring) {
    // {{{ load
    var myOptions = {
        zoom:8,
        maxZoom: 11,
        center: new google.maps.LatLng(33.3, -117.3),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(document.getElementById("map"), myOptions);
    // Location box
    var startLat = rounder(map.getCenter().lat());
    var startLng = rounder(map.getCenter().lng());
    var controlDiv = document.createElement('DIV');
    controlDiv.id = 'googleCoordBox';
    controlDiv.style.margin = '10px';
    controlDiv.className = 'googleCustomControl';
    controlDiv.innerHTML = '<strong>Location:</strong> <span id="currentCoords">'+startLat+"N, "+startLng+"E"+'</span>';
    map.controls[ google.maps.ControlPosition.LEFT_BOTTOM].push(controlDiv);
    // Mousemove
    google.maps.event.addListener(map, 'mousemove', function(e) {
        var myLat = e.latLng.lat();
        var latStr = (Math.round(myLat*100)/100).toString();
        var myLng = e.latLng.lng();
        var lngStr = (Math.round(myLng*100)/100).toString();
        document.getElementById("currentCoords").innerHTML = latStr+"N, "+lngStr+"E";
    });

    // Icon Container
    iconDiv = document.createElement('DIV');
    iconDiv.id = 'googleLegend';
    iconDiv.style.margin = '0 10px';
    iconDiv.className = 'googleCustomControl';
    var legend = [
        '<p style="margin:0 auto;padding:0;"><strong>',
        netstring,
        ' Network [',
        myDateStr,
        ']</strong></p>'
    ]
    legend.push('<table>');
    legend.push('</table>')
    legend.push('</div>');
    iconDiv.innerHTML = legend.join('');
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(iconDiv);
    loadStas(map, sta_file, snet);
    // }}} load
}
function rounder(val){
    // {{{ rounder
    return Math.round(val*100)/100;
    // }}} rounder
}
function loadStas(mymap, sta_file, snet) {
    // {{{ loadStas
    $.ajax({
        type:"GET",
        url:sta_file,
        dataType:"json",
        success: function(stations) {
            $.each(stations.active, function(sta, stavals) {
                if(stavals.snet === snet) {
                    var stapoint = new google.maps.LatLng(stavals.lat, stavals.lon);
                    if(stavals.orbstat.alert == 'ok' ) {
                        sta_status['online']++;
                    }
                    sta_status['total']++;
                    var comp = '';
                    var cssclass = '';
                    $.each(sta_obj, function(grp, grp_obj) {
                        switch(grp) {
                            case 'network':
                                comp = stavals.snet;
                                cssclass = stavals.snet;
                                break;
                            case 'comms_type':
                                comp = stavals.commtype.value;
                                cssclass = stavals.commtype.css;
                                break;
                            case 'comms_provider':
                                comp = stavals.provider.value;
                                cssclass = stavals.provider.css;
                                break;
                            case 'datalogger':
                                if(typeof stavals.datalogger === "undefined") {
                                    comp = 'FOO';
                                    cssclass = 'foo';
                                } else {
                                    comp = stavals.datalogger.value;
                                    cssclass = stavals.datalogger.css;
                                }
                                break;
                            case 'sensor':
                                if(typeof stavals.sensor === "undefined") {
                                    comp = 'FOO';
                                    cssclass = 'foo';
                                } else {
                                    [comp, cssclass] = parseSensor(stavals.sensor);
                                }
                                break;
                        }
                        latency_obj[sta] = stavals.orbstat.alert;
                        if(comp in sta_obj[grp]) {
                            sta_obj[grp][comp].push(sta);
                        } else {
                            sta_obj[grp][comp] = [sta];
                            style_obj[grp][comp] = cssclass;
                        }
                    });
                    sta_arr.push(sta);
                    var stamarker = createStaMarker(
                        mymap,
                        stapoint,
                        sta,
                        stavals,
                        style_obj
                    );
                    markerArray.push(stamarker);
                }
            });
        },
        error: function() {
            alert("Could not load Anza station locations");
        },
        complete: function() {
            printStatus(sta_status);
            // Create tabs
            var tabPtr = createList(
                sta_arr,
                sta_obj,
                style_obj,
                latency_obj
            )
            // Load stations & render
            var typeControlDiv = document.createElement('DIV');
            var typeControl = new DisplayTypeControl(
                mymap,
                typeControlDiv,
                types,
                markerArray,
                style_obj,
                tabPtr
            );
            typeControl.index = 1;
            // Create tabs
            /*
            var tabPtr = createList(
                sta_arr,
                sta_obj,
                style_obj,
                latency_obj,
                typeControl
            );
            */
            mymap.controls[google.maps.ControlPosition.RIGHT_TOP].push(typeControlDiv);

            // This just adds a change in the label color. Unimportant
            google.maps.event.addListener(mymap, 'maptypeid_changed', function() {
                if(mymap.getMapTypeId() == 'hybrid' || mymap.getMapTypeId() == 'satellite') {
                    for(i in markerArray){
                        markerArray[i].set('labelClass', 'gmapLabelsWhite');
                    }
                } else {
                    for(i in markerArray){
                        markerArray[i].set('labelClass', 'gmapLabelsBlk');
                    }
                }
            });
        }
    });
    // }}} loadStas
}
function createStaMarker(mymap, point, sta, sta_obj, style_obj) {
    // {{{ createStaMarker
    var contentString = [
        '<div class="gmapInfoContainer">',
        '<table>',
            '<tr><th>Code</th><td>'+sta+'</td></tr>',
            '<tr><th>Name</th><td>'+sta_obj.staname+'</td></tr>',
            '<tr><th>Latitude</th><td>'+rounder(sta_obj.lat)+'</td></tr>',
            '<tr><th>Longitude</th><td>'+rounder(sta_obj.lon)+'</td></tr>',
            '<tr><th>Elevation</th><td>'+sta_obj.elev+' km</td></tr>',
            '<tr><th>Comms Type</th><td>'+sta_obj.commtype.value+'</td></tr>',
            '<tr><th>Comms Provider</th><td>'+sta_obj.provider.value+'</td></tr>',
            '<tr><th>Instrument</th><td>'+sta_obj.insname+'</td></tr>',
            '<tr><th>Latency</th><td>'+sta_obj.orbstat.latency_readable+'</td></tr>',
        '</table>',
        '<p><a href="'+sta+'">View station details &raquo;</a></p>',
        '</div>'
    ].join('');

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var imgstr = iconPath+'network_AZ_'+sta_obj.orbstat.alert+'.gif';
    var image = new google.maps.MarkerImage(imgstr,
        new google.maps.Size(34, 34),
        new google.maps.Point(0, 0)
    );
    // info is custom to this script
    [sensor_comp, sensor_cssclass] = parseSensor(sta_obj.sensor);
    // console.log("FOO: ", comp, cssclass);
    var marker = new MarkerWithLabel({
        position: point,
        draggable: false,
        raiseOnDrag: false,
        labelContent: sta,
        labelAnchor: new google.maps.Point(13, 0),
        labelClass: 'gmapLabelsBlk',
        labelStyle: {opacity:1.0},
        icon: image,
        info: {
            'network':imgstr,
            'datalogger':style_obj['datalogger'][sta_obj.datalogger.value],
            // 'sensor':style_obj['sensor'][sta_obj.sensor.value],
            'sensor':sensor_cssclass,
            'comms_type':style_obj['comms_type'][sta_obj.commtype.value],
            'comms_provider':style_obj['comms_provider'][sta_obj.provider.value]
        },
        map: mymap
    });
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(mymap, marker);
    });
    return marker;
    // }}} createStaMarker
}
function printStatus(statusObj) {
    // {{{ printStatus
    if(statusObj.total > 0) {
        var statusMsg = ['<p><strong>There are currently ',
            statusObj['online'],
            ' stations returning data out of a total number of ',
            statusObj['total'],
            ' stations.</strong></p>'].join('')
        $(statusDiv).html(statusMsg);
        $(nrecsSpan).html(statusObj['total']);
    } else {
        $(statusAlertDiv).show();
        $(nrecsSpan).html('*unknown*');
    }
    // }}} printStatus
}
function createList(testArr, listObj, stylesObj, latencyObj, typeControl) {
    // {{{ createList
    var tableHead = [
        '<table class="deploymentTbl">',
        '<thead></thead><tfoot></tfoot>',
        '<tbody><tr>'].join('');
    var tableFoot = ['</ul>',
         '</td></tr>',
         '</tbody>',
         '</table>'].join('');
    if(testArr.length > 0) {
        var myList = ['<ul id="groups">'], myTabbedDivs = [];
        $.each(listObj, function(grouping, sta) {
            myList.push('<li><a href="#tabs-'+grouping+'">'+grouping+'</a></li>');
        });
        myList.push('</ul>');
        $.each(listObj, function(grouping, val) {
            myTabbedDivs.push('<div id="tabs-'+grouping+'">');
            $.each(val, function(x, arr) {
                var style = grouping.toUpperCase() + stylesObj[grouping][x];
                myTabbedDivs.push(tableHead);
                var rowContent = ['<td class="tableContent'+style+' sixty">',
                    x,
                    '</td>',
                    '<td class="tableContent'+style+'">',
                    '<ul>'].join('');
                myTabbedDivs.push(rowContent);
                $.each(arr, function(y, val) {
                    var icon = latencyObj[val];
                    var listStr = ['<li class="tableContent'+style+' tableContentTRANS">',
                        '<a href="/deployments/anza/'+val+'">'+val+'</a>',
                        '<img border="0" ',
                        'src="/images/icons/anf_status_'+icon+'.gif" ',
                        'align="absmiddle" alt="status icon" />',
                        '</li>'].join('');
                    myTabbedDivs.push(listStr);
                });
                myTabbedDivs.push(tableFoot);
            });
            myTabbedDivs.push('</div>');
        });
        $(tabDiv).append(myList.join(''));
        $(tabDiv).append(myTabbedDivs.join(''));
        return tabDiv
    } else {
        $(listDiv).append(errorMsg);
    }
    // }}} createList
}
//]]>
