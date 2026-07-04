// public/js/vworld-map.js
// VWorld 2D 지도 초기화
// Next.js의 MapView.tsx가 <div id="vworld-map"> 안에 이 파일을 script로 삽입합니다.

    //지도 초기위치, 초기확대 설정
    vw.ol3.CameraPosition.center = [14135322.3133077,4514170.2785697]; //서울 중심 (EPSG:3857)
    //[14328808.6, 4191880.7]; //부산 중심 (EPSG:3857)
    vw.ol3.CameraPosition.zoom = 11;

    vw.ol3.MapOptions = {
        basemapType: vw.ol3.BasemapType.GRAPHIC,//PHOTO_HYBRID, 지도 종류 설정
        controlDensity: vw.ol3.DensityType.EMPTY,//지도 컨트롤러 밀도 설정
        interactionDensity: vw.ol3.DensityType.BASIC,//지도 인터렉션 밀도 설정
        controlsAutoArrange: true,
        homePosition: vw.ol3.CameraPosition,
        initPosition: vw.ol3.CameraPosition,
    };
    window.vmap = new vw.ol3.Map("vmap", vw.ol3.MapOptions);

    let markerLayer = new vw.ol3.layer.Marker(window.vmap);
    
    vw.ol3.markerOption = {
        x : 14126754.2858722,
        y : 4519757.4390882,
        epsg : "EPSG:3857",//EPSG:3857 기반 좌표
//        title: '(불광천)',
        contents: <a href='https://www.riverlevel-info.kr/seoul/1401'>불광천 증산교의 현재 수위 정보 보기</a>,
        watgCd: '1401',
//        title : '불광천 증산교',
//        contents : '불광천 증산교 위치입니다.',
        iconUrl : href="js/pin1.png",
        text : {
            offsetX: -20,
            offsetY: 12,//핀 위치설정
            font: '15px Calibri,sans-serif',//글자 크기 및 폰트 설정
            fill: {color: '#000'},//글자색 설정
            stroke: {color: '#fff', width: 4},
            text: '불광천 증산교'
        }
    };
    markerLayer.addMarker(vw.ol3.markerOption);
    
    vw.ol3.markerOption = {
        x : 14128344.9523401,
        y : 4518626.2154397,
        epsg : "EPSG:3857",//EPSG:3857 기반 좌표
        title : '홍제천 사천교',
        contents : '홍제천 사천교 위치입니다.',
        iconUrl : href="js/pin1.png",
        text : {
            offsetX: -20,
            offsetY: 12,//핀 위치 설정
            font: '15px Calibri,sans-serif',//글자 크기 및 폰트 설정
            fill: {color: '#000'},//글자색 설정
            stroke: {color: '#fff', width: 4},//글자 테두리 설정
            text: '홍제천 사천교'
        }
    };
    markerLayer.addMarker(vw.ol3.markerOption);

    
    vw.ol3.markerOption = {
        x : 14127723.3523401,
        y : 4518246.2154397,
        epsg : "EPSG:3857",//EPSG:3857 기반 좌표
//        title : '홍제천 성산2교',
        contents: <a href='https://www.riverlevel-info.kr/seoul/1501'>홍제천 성산2교의 현재 수위 정보 보기</a>,
//        contents : '홍제천 성산2교 위치입니다.',
        iconUrl : href="js/pin1.png",
        text : {
            offsetX: -20,
            offsetY: 12,//핀 위치 설정
            font: '15px Calibri,sans-serif',//글자 크기 및 폰트 설정
            fill: {color: '#000'},//글자색 설정
            stroke: {color: '#fff', width: 4},//글자 테두리 설정
            text: '홍제천 성산2교'
        }
    };
    markerLayer.addMarker(vw.ol3.markerOption);



    vw.ol3.markerOption = {
        x : 14126438.696491,
        y : 4500430.687489,
        epsg : "EPSG:3857",//EPSG:3857 기반 좌표
        title : '안양천 기아대교',
        contents : '안양천 기아대교 위치입니다.',
        iconUrl : href="js/pin1.png",
        text : {
            offsetX: -20,
            offsetY: 12,//핀 위치 설정
            font: '15px Calibri,sans-serif',//글자 크기 및 폰트 설정
            fill: {color: '#000'},//글자색 설정
            stroke: {color: '#fff', width: 4},//글자 테두리 설정
            text: '안양천 기아대교'
        }
    };
    markerLayer.addMarker(vw.ol3.markerOption);

    vw.ol3.markerOption = {
        x : 14123108.126711,
        y : 4508943.279312,
        epsg : "EPSG:3857",//EPSG:3857 기반 좌표
        title : '안양천 고척교',
        contents : '안양천 고척교 위치입니다.',
        iconUrl : href="js/pin1.png",
        text : {
            offsetX: -20,
            offsetY: 12,//핀 위치 설정
            font: '15px Calibri,sans-serif',//글자 크기 및 폰트 설정
            fill: {color: '#000'},//글자색 설정
            stroke: {color: '#fff', width: 4},//글자 테두리 설정
            text: '안양천 고척교'
        }
    };
    markerLayer.addMarker(vw.ol3.markerOption);
    
    
    
    
    window.vmap.addLayer(markerLayer);


// ── 지도 종류 변경 ────────────────────────────────────
function setMode(type) {
  var basemapType = vw.ol3.BasemapType[type];
  window.vmap.setBasemapType(basemapType);

  // 활성 버튼 스타일 업데이트
  var buttons = document.querySelectorAll('#map-type-btns button');
  var typeMap = {
    'GRAPHIC':       0,
    'GRAPHIC_WHITE': 1,
    'GRAPHIC_NIGHT': 2,
    'PHOTO':         3,
    'PHOTO_HYBRID':  4,
  };
  buttons.forEach(function(btn, i) {
    btn.classList.toggle('active', i === typeMap[type]);
  });
}
