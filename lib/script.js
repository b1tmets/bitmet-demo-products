(function (window, document, indefined) {

    // definiendo capas de tiles de prueba

    var OPNVKarte = L.tileLayer('https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Memomaps &mdash; Bitmet: Servicios Basados en Aplicaciones Meteorológicas'
    });

    var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Tiles &copy; OpenStreetMap &mdash; Bitmet: Servicios Basados en Aplicaciones Meteorológicas'
    });

    var OpenStreetMap_Mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Tiles &copy; OpenStreetMap &mdash; Bitmet: Servicios Basados en Aplicaciones Meteorológicas'
    });

    var GeoportailFrance = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
        attribution: "Tiles &copy; IGN's WMTS service &mdash; Bitmet: Servicios Basados en Aplicaciones Meteorológicas",
        bounds: [[-75, -180], [81, 180]],
        minZoom: 2,
        maxZoom: 19,
        apikey: 'choisirgeoportail',
        format: 'image/jpeg',
        style: 'normal'
    });

    var Esri_WorldImagery = L.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
        "Tiles &copy; Esri &mdash; Bitmet: " +
        "Servicios Basados en Aplicaciones Meteorológicas"
    }
    );

    var Esri_DarkGreyCanvas = L.tileLayer(
    "http://{s}.sm.mapstack.stamen.com/" +
        "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
        "{z}/{x}/{y}.png",
    {
        attribution:
        "Tiles &copy; Stamen Design &mdash; Bitmet: " +
        "Servicios Basados en Aplicaciones Meteorológicas"
    }
    );

    // creando el selector de capas en la pagina

    var baseLayers = {
    "Grey Canvas": Esri_DarkGreyCanvas,
    "Satellite": GeoportailFrance,
    "BlueMarble": Esri_WorldImagery,
    "OpenStreetMap": OpenStreetMap_Mapnik,
    "OpenTopoMap": OpenTopoMap,
    "OPNVKarte": OPNVKarte,
    };
  
    // creando objeto mapa

    var Weather = {
        map: L.map('map', {
            zoom: 5,
            zoomControl: true,
            minZoom: 2,
            maxZoom:13,
            layers: [Esri_DarkGreyCanvas],
            fullscreenControl: true,
            timeDimension: true,
            timeDimensionControl: true,
            timeDimensionOptions: {
                 times: "2017-02-01T23:00:00Z"        
            },
            center: [21.999977, -80.08853], 
            maxBounds: [
                //south west
                [19.340546, -85.71704],
                //north east
                [24.264412, -73.765396]
                ], //restringir el mapa al area que interesa
        }).setView([21.999977, -80.08853], 7),
        
        layers: [
            // Windy.com tile layer
            //L.tileLayer('https://tiles.windy.com/tiles/v8.1/darkmap/{z}/{x}/{y}.png'),
            //L.tileLayer('https://tiles.windy.com/tiles/v7/labels-7.2.1/labels-loc/{z}/{x}/{y}.png')

            // Map tiles layers gratuitos
            L.control.layers(baseLayers)
        ],
        
        
        // Creando lista de imagenes y json a cargar
        
        url_params: {
            base: 'data/${model}_${var}_${level}_${time}.${ext}',   // /${date}/
            time: 20,
            model: 'WRF',
            date: '2018_09_27',
            level: 'SingleLevel',
            var: '2mRelativeHumidity',

            build: function(args, ext) {
                var t = self.url_params;
                if (!args) args = t.var;
                if (!ext) ext = 'png';

                return t.base
                    .replace('${date}', t.date).replace('${var}', args)
                    .replace('${time}', t.time).replace('${model}', t.model)
                    .replace('${level}', t.level).replace('${ext}', ext);
            }
        },
        //bordes de la imagen de salida del modelo
        _bounds: new L.LatLngBounds(
            new L.LatLng(19.340546,-85.71704),
            new L.LatLng(24.264412,-73.765396)
        ),
        init: function() {
            
            this.layers.forEach(function (layer) {
                layer.addTo(self.map);
            });

            this.__init_animate(this.url_params.build('10mWindSpeed', 'json'));

            $('#prev').on('click', this.__actions.prev);
            $('#next').on('click', this.__actions.next);
            $('#var').on('change', this.__actions.var);
            $('#bar').on('click', this.__actions.bar);

            this._imglayer = new L.ImageOverlay(this.url_params.build(), this._bounds,{opacity: 0.4})
                .addTo(this.map);
        },
        __init_animate: function(url) {
            WindJSLeaflet.init({
                localMode: false,
                map: this.map,
                layerControl: L.control.layers(),
                useNearest: false,
                timeISO: null,
                nearestDaysLimit: 7,
                displayValues: true,
                displayOptions: {
                    displayPosition: 'bottomleft',
                    displayEmptyString: 'No wind data'
                },
                overlayName: '10mWindSpeed',
            
                // https://github.com/danwild/wind-js-server
                pingUrl: '#',
                latestUrl: url,
                //nearestUrl: 'http://localhost/demo/current-wind-surface-level-gfs-1.0.json',
                errorCallback: function(err){
                    //console.log('handleError...');
                    console.log(err);
                }
            });
            this.__interval = setInterval(this.__checkAnimate, 1000);
            this.__interval = undefined;
        },
        __checkAnimate: function() {
            if (WindJSLeaflet._canvasLayer) {
                WindJSLeaflet._canvasLayer.addTo(self.map);
                clearInterval(self.__interval);
            }
        },
        __actions: {
            prev: function () {
                self.url_params.time--;
                self.__update_map();
            },
            next: function () {
                self.url_params.time++;
                self.__update_map();
            },
            var: function() {
                self.url_params.var = $(this).val();
                self.__update_map();
            },
            bar: function(e) {
                var off = e.clientX - 129;
                off = Math.floor(off / 60) * 60 + 60;
                $(this).find('.progress').css('width', off + 'px');
            }
        },
        __update_map: function() {
            $.getJSON(self.url_params.build('10mWindSpeed', 'json'), function (data) {
                WindJSLeaflet._clearWind();
                WindJSLeaflet._data = data;
                WindJSLeaflet._initWindy(data);
            });
            //Actualizar la imagen de modelo
            self._imglayer._image.src = self.url_params.build();
        }
    };

    
    var self = Weather;

    function expose() {
        window.Wh = Weather;
    }
    if (typeof window !== 'undefined') {
        expose();
    }

}(window, document));
