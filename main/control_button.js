// キャンバス設定
var canvasFrame;
var width = window.innerWidth;
var height = window.innerHeight;

// カメラ設定
var viewAngle = 80;
var aspect = width / height;
var near = 0.1;
var far = 3000;

var scene;

init(); // 全般設定初期化
init_camera(); // カメラ設定初期化

function init() {
	// レンダラーの作成
	renderer = new THREE.WebGLRenderer;
	// canvas要素のサイズを設定
	renderer.setSize( width, height );
	// 背景色を指定
	renderer.setClearColor( 0xEEEEEE, 1.0 );
	// シーンの作成
	scene = new THREE.Scene;
	// ウィンドウサイズが変更された際のイベントを登録
	window.addEventListener( 'resize', onWindowResize, false );
}


function init_camera() {
	// カメラを作成
	camera = new THREE.PerspectiveCamera( viewAngle, aspect, near, far );
	// カメラの一を設定
    camera.position.set( 8, 8, 8 );
    // カメラの向きを設定
    camera.lookAt( { x: 0, y: 0, z: 0 } );
    // マウスコントロールできるようにする
    controls = new THREE.OrbitControls( camera );
    // 光源
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
	directionalLight.position.z = 3;
	scene.add( directionalLight );
}

function onWindowResize() {
	// アスペクト比を設定
	camera.aspect = window.innerWidth / window.innerHeight;
	// カメラの設定を更新
	camera.updateProjectionMatrix();
	// canvas要素のサイズを設定
	renderer.setSize( window.innerWidth, window.innerHeight );
}


CubeManager.initCube();

$(function() {
	// キャンバスフレームDOM要素の取得
	canvasFrame = document.getElementById("canvas_frame");
	// body要素にcanvas要素を追加
	$("#canvas_frame").append(renderer.domElement);

	function render() {
		// アニメーション追加
		requestAnimationFrame(render);
		// レンダリング
		renderer.render(scene, camera);
		// マウスコントロール
		controls.update();

		// キューブ動作
		CubeManager.render();
	}
	render();
});

/**
 * イベントハンドラ
 */
$(function() {
	$(".button_axis").on("click", function() {
		var val = $(this).val();
		CubeManager.selectAxis(val);
	});

	$(".button_pos").on("click", function() {
		var val = $(this).val() - 0;
		CubeManager.selectPos(val);
	});

	$(".button_rotate").on("click", function() {
		var val = $(this).val() - 0;
		CubeManager.rotate(val);
	});
});
