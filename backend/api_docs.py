"""
API Documentation and Endpoints listing
"""
from django.urls import get_resolver
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def api_endpoints(request):
    """
    List all available API endpoints with their methods and descriptions
    """
    endpoints = []
    resolver = get_resolver()
    
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'pattern'):
            route = str(pattern.pattern)
            
            # Skip admin and static files
            if route.startswith('admin') or route.startswith('static') or route.startswith('media'):
                continue
            
            # Get the view
            if hasattr(pattern, 'callback'):
                view = pattern.callback
                methods = []
                
                # Determine HTTP methods
                if hasattr(view, 'cls'):
                    # Class-based view
                    if hasattr(view.cls, 'http_method_names'):
                        methods = [m.upper() for m in view.cls.http_method_names if m != 'options']
                else:
                    # Function-based view
                    if hasattr(view, 'actions'):
                        methods = list(view.actions.keys())
                    else:
                        methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
                
                # Get docstring
                doc = view.__doc__ or 'No description'
                
                endpoints.append({
                    'path': f'/api/{route}',
                    'methods': methods,
                    'description': doc.strip(),
                    'name': pattern.name or 'unnamed'
                })
    
    return Response({
        'total_endpoints': len(endpoints),
        'endpoints': sorted(endpoints, key=lambda x: x['path'])
    })


@api_view(['GET'])
def api_docs_html(request):
    """
    Return HTML documentation page
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Txopela API Documentation</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #0077B6 0%, #2D6A4F 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            .header p {
                font-size: 1.1em;
                opacity: 0.9;
            }
            .content {
                padding: 40px;
            }
            .section {
                margin-bottom: 40px;
            }
            .section-title {
                font-size: 1.5em;
                color: #0077B6;
                margin-bottom: 20px;
                border-bottom: 2px solid #0077B6;
                padding-bottom: 10px;
            }
            .endpoint {
                background: #f8f9fa;
                border-left: 4px solid #0077B6;
                padding: 20px;
                margin-bottom: 15px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            .endpoint:hover {
                background: #e8f4f8;
                transform: translateX(5px);
            }
            .endpoint-path {
                font-family: 'Courier New', monospace;
                font-size: 1.1em;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
                word-break: break-all;
            }
            .methods {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            .method {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 0.85em;
                font-weight: bold;
                color: white;
            }
            .method.GET { background: #61affe; }
            .method.POST { background: #49cc90; }
            .method.PUT { background: #fca130; }
            .method.PATCH { background: #50e3c2; }
            .method.DELETE { background: #f93e3e; }
            .method.HEAD { background: #9012fe; }
            .method.OPTIONS { background: #0077B6; }
            .description {
                color: #666;
                font-size: 0.95em;
                line-height: 1.5;
            }
            .auth-info {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin-bottom: 30px;
                border-radius: 4px;
            }
            .auth-info strong {
                color: #856404;
            }
            .test-section {
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 20px;
                margin-top: 30px;
                border-radius: 4px;
            }
            .test-section h3 {
                color: #2e7d32;
                margin-bottom: 15px;
            }
            .test-input {
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }
            .test-button {
                background: #4caf50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            }
            .test-button:hover {
                background: #45a049;
            }
            .response {
                background: #f5f5f5;
                border: 1px solid #ddd;
                padding: 15px;
                margin-top: 15px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                max-height: 300px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                border-top: 1px solid #ddd;
            }
            .search-box {
                margin-bottom: 30px;
            }
            .search-box input {
                width: 100%;
                padding: 12px;
                font-size: 1em;
                border: 2px solid #ddd;
                border-radius: 4px;
                transition: border-color 0.3s;
            }
            .search-box input:focus {
                outline: none;
                border-color: #0077B6;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌍 Txopela API Documentation</h1>
                <p>Complete API Reference and Testing Interface</p>
            </div>
            
            <div class="content">
                <div class="auth-info">
                    <strong>🔐 Authentication:</strong> Most endpoints require a JWT token. 
                    Login first at <code>/api/auth/login/</code> to get your token, 
                    then include it in the Authorization header: <code>Bearer YOUR_TOKEN</code>
                </div>
                
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="🔍 Search endpoints..."K)
.HTTP_200_Otus=status(html, stan Responsetur""
    re"    html>

    </   </body>
   </script>     }
            ;
    })         
    ';</div>+ 'r.message      er           
        Error: ' +  red;">lor:" style="coonses="resp= '<div clasTML Div.innerH  response                err => {
  .catch(          
             })        '</div>';
  null, 2) + fy(data,tringiON.s          JS           >' + 
   onse"esplass="r<div cnnerHTML = 'esponseDiv.i  r                 
 data => {    .then(            on())
=> r.jshen(r  .t            
            }),
       aders: he     headers              method,
  ethod:     m         
      ch(url, {      fet         
           }
               
        token;r ' +are = 'Ben']tiozahorieaders['Aut       h             ken) {
if (to                   };
         son',
    tion/jica'appl': -Typetent      'Con      {
        eaders =     const h         ');
   pela_tokentem('txoStorage.getIallocnst token =     co         
                v>';
   </di...Loadingnse">esposs="r'<div claHTML = eDiv.inner    respons           
                    }
         ;
    rnetu          r       ';
   /div>enter a URL<ease  red;">Pl"color:le=se" styespon class="r<div = 'TMLseDiv.innerHpones  r               url) {
    if (!       
                        se');
('testResponementByIdgetEl= document.iv ponseD const res              ').value;
 odId('testMethElementByument.get= doc method   const              lue;
tUrl').vatById('teslemenocument.getErl = d    const u        
    ndpoint() {ion testE       funct
                      }
);
       nts(filteredderEndpoi     ren            );
           rch)
    (sea.includese()toLowerCason.iptiscrp.de    e           
     | (search) |esincludwerCase().ath.toLo.pep                  => 
  lter(ep s.fillEndpoint = atered   const fil       );
      owerCase(e.toLut').valud('searchInpetElementByIocument.gsearch = d const         
       ndpoints() {terEction fil fun               
       }
             
 html;.innerHTML =erntain         co 
                     
    });      
       >';= '</div  html +              
                 });
                   
        </div>'; += '  html                     '</div>';
 + ription scp.deon">' + escripti"dediv class=html += '<                       ;
 v>'= '</di html +              
         ;     })                   an>';
 + m + '</sp+ '">' ' + m ss="methodpan cla+= '<sl          htm           {
         => forEach(mthods.p.me       e            >';
     hods"lass="met'<div chtml +=                ;
         + '</div>'+ ep.path th">' endpoint-pass="+= '<div cla       html               ';
   path + '">' + ep.ta-path="" daendpointiv class=" += '<d    html                    => {
(ep ].forEachped[category     grou        
                  
         /div>';+ '<e() toUpperCas + category.📌 '-title">tionass="sec<div cl= ' +  html                  on">';
ass="secti += '<div cl        html           ory => {
 teg(caforEacht().or.srouped)s(gkey    Object.       '';
      = mllet ht              
                   });
             );
  .push(epy]orcateged[up     gro               = [];
 ory]ped[categegory]) grouatouped[c!grf (      i              || 'auth';
')[2] h.split('/ ep.pattegory =onst ca c                {
    =>.forEach(ep nts     endpoi      y
     y categoroup b// Gr             
             };
       {st grouped =        con
        ;iner')contats-poinntById('endlemeetEcument.g doiner =tanst con      co          ts) {
ndpoindpoints(enderEnion refunct          
           
        });          
 /div>';r + '<' + erndpoints: loading eError x;">padding: 20por: red; ="col '<div style               
         rHTML =.inneer')ntain-coendpointsyId('tBt.getElemen documen               r => {
    .catch(er                   })
        ts);
     ints(allEndpoderEndpoin   ren          s;
       a.endpointints = datlEndpo al                
   (data => {     .then       ())
    json(r => r.  .then           s/')
   i/endpoint  fetch('/ap          age load
points on p/ Fetch end      /  
             ;
   = []ts dpoin allEn    let    ript>
       <sc        
  div>
          </</div>
         
    ork</p>ST Framew Django REuilt with0 | Bla API v1.pe<p>Txo           >
     oter"ass="fo cl   <div               
 
           </div>
      /div>     <           iv>
se"></dsponestRe"t  <div id=         
         utton>Test</bt()">oindptestEn onclick="st-button" class="teon    <butt           ct>
     ele       </s          on>
   /optiion>PATCH<    <opt            >
        /optionE<LEToption>DE        <                option>
PUT</ion><opt                        ion>
>POST</opt     <option                  /option>
 ion>GET<<opt                      
  : 10px;">argin-right; mnline-block: ilaydisph: 100px; e="widt stylhod"Metd="test-input" is="testselect clas        <         /)">
   ionscatlo(e.g., /api/oint URL "Enter endpeholder=" plac"testUrlput" id=s="test-inxt" clase="tenput typ        <i            owser:</p>
brfrom your y  directlany endpoint;">Test pxttom: 15"margin-bo<p style=                     Test</h3>
ck<h3>🧪 Qui               n">
     est-sectio"tiv class=          <d         
           
  r"></div>-containeendpoints  <div id="             
              div>
      </             oints()">
ilterEndp onkeyup="f