/**
 * キューブクラス
 */

var CubeUtil = (function() {
	// キューブサイズ
	var _size = 1.5;
	// キューブ間
	var _interval = 0.2;
	// １軸のキューブ数(立方体形式前提)
	var _count = 3;

	/*
	 * 前提：立方体はその中心座標を基準に配置される
	 */

	// 中心
	var _center = ((_size + _interval) * (_count - 1)) / 2;

	return {
		size : _size,
		interval : _interval,
		count : _count,
		center : _center,
	}
})();

/**
 * 回転行列を取得する
 *
 * @param r
 *            ラジアン
 * @return x,y,z軸を基準とした回転行列
 *
 */
function getRotateMatrix(r) {
	var a = -Math.sin(r)
	var b = Math.cos(r)

	// 回転行列
	return {
		x : [ [ 1, 0, 0 ], [ 0, 0, a ], [ 0, -a, 0 ] ],
		y : [ [ 0, 0, -a ], [ 0, 1, 0 ], [ a, 0, 0 ] ],
		z : [ [ 0, a, 0 ], [ -a, 0, 0 ], [ 0, 0, 1 ] ],
	}
};

// メッシュの色指定用
var color_num = 0;

var Cube = (function() {
	// 立方体定義
	var _geometry = new THREE.BoxGeometry(CubeUtil.size, CubeUtil.size,
			CubeUtil.size);
	_geometry.useQuaternion = true;

	var ret = function(x, y, z) {
		// メッシュの色設定
		if(color_num % 2 == 0) {
			var _material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
		}else{
			var _material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		}

		if(color_num == 13){
       		color_num = color_num + 2;
       	} else {
       		color_num++;
       	}
	
		// メッシュ作成
		this.mesh = new THREE.Mesh(_geometry, _material);

		// 初期位置設定
		this.mesh.position.set(x, y, z);
	};

	ret.prototype = {
		/**
		 * シーンに追加
		 *
		 * @param scene
		 *            シーン
		 */
		addScene : function(scene) {
			scene.add(this.mesh);
		},

		/**
		 * シーンから除去
		 *
		 * @param scene
		 *            シーン
		 */
		removeScene : function(scene) {
			scene.remove(this.mesh);
		},

		/**
		 * 回転
		 *
		 * @param q
		 *            クォータニオン
		 */
		rotate : function(q) {
			var qq = q.clone();
			qq.multiply(this.mesh.quaternion.clone());
			this.mesh.quaternion.copy(qq);
		},

		/**
		 * 移動
		 *
		 * @param d
		 *            移動先座標
		 */
		move : function(d) {
			if (d.x) {
				this.mesh.position.x = d.x;
			}
			if (d.y) {
				this.mesh.position.y = d.y;
			}
			if (d.z) {
				this.mesh.position.z = d.z;
			}
		}
	};
	return ret;
})();

var R_Cube = (function() {
	ret = function(x, y, z) {
		Cube.call(this, 0, 0, 0);
		this.setPosition(x, y, z);

		this.rad = {};
	}

	ret.prototype = new Cube();

	/**
	 * 正規座標を元に位置を設定
	 *
	 * @param x
	 * @param y
	 * @param z
	 */
	ret.prototype.setPosition = function(x, y, z) {
		// 保存
		this.x = x;
		this.y = y;
		this.z = z;

		// 実際のキューブ位置は調整する
		var s = CubeUtil.size + CubeUtil.interval;
		var a = -CubeUtil.center;
		this.mesh.position.set(this.x * s + a, this.y * s + a, this.z * s + a);
	}

	/**
	 * 選択状態の色分け
	 *
	 * @param v
	 *            選択しているフラグ
	 */
	ret.prototype.setSelect = function(v) {
		if (v) {
			// 選択中の軸を半透明にする
			this.mesh.material.transparent = true;
			this.mesh.material.opacity = 0.7;
			

		} else {
			// 透明を解く（デフォルト状態）
			this.mesh.material.transparent = false;
		}
	}


	/**
	 * 円運動を行う
	 *
	 * @param axis
	 *            基準軸
	 * @param r
	 *            移動ラジアン
	 */
	ret.prototype.moveRound = function(axis, r) {
		// 角度取得
		// var rad = info.r + r;
		var rad = this.rad[axis].r + r;

		// 移動先
		var move_0 = this.rad[axis].d * Math.cos(rad);
		var move_1 = this.rad[axis].d * Math.sin(rad);
		// 軸に応じて移動量定義
		var toP;
		if (axis === "x") {
			toP = {
				y : move_0,
				z : move_1,
			}
		} else if (axis === "y") {
			toP = {
				z : move_0,
				x : move_1,
			}
		} else {
			toP = {
				x : move_0,
				y : move_1,
			}
		}
		this.move(toP);
	}

	/**
	 * 回転開始時の位置情報を保存する
	 */
	ret.prototype.setRad = function() {
		this.rad = {
			x : this.getRadian2D("x"),
			y : this.getRadian2D("y"),
			z : this.getRadian2D("z"),
		}
	}

	/**
	 * 軸axisを基準とした角度と距離を計算する(つまり2次元)
	 *
	 * @param axis
	 *            軸
	 */
	ret.prototype.getRadian2D = function(axis) {
		var ret = {};
		var pos = this.mesh.position;
		// 軸毎に場合分け
		if (axis === "x") {
			ret.d = Math.sqrt(pos.y * pos.y + pos.z * pos.z);
			if (ret.d === 0) {
				// 原点上は角度0としておく
				ret.r = 0;
			} else {
				ret.r = Math.atan2(pos.z, pos.y);
			}
		} else if (axis === "y") {
			ret.d = Math.sqrt(pos.z * pos.z + pos.x * pos.x);
			if (ret.d === 0) {
				ret.r = 0;
			} else {
				ret.r = Math.atan2(pos.x, pos.z);
			}
		} else {
			ret.d = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
			if (ret.d === 0) {
				ret.r = 0;
			} else {
				ret.r = Math.atan2(pos.y, pos.x);
			}
		}
		return ret;
	}

	/**
	 * 座標を回転させる(Cubeのpositionではなく正規座標)
	 *
	 * @param R
	 *            回転行列
	 */
	ret.prototype.rotateCoordinate = function(R) {
		// 現在座標行列(ベクトル)
		// 原点が中心となるように移動
		var a = (CubeUtil.count - 1) / 2;
		var A = [ this.x - a, this.y - a, this.z - a ];
		// 変換後行列(ベクトル)
		var X = [ 0, 0, 0 ];

		// 行列の積を計算
		var n = R.length;
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				X[i] = X[i] + A[j] * R[i][j];
			}
		}

		// 座標を更新
		this.x = X[0] + a;
		this.y = X[1] + a;
		this.z = X[2] + a;
	}

	return ret;
})();

var CubeManager = (function() {
	// 全キューブ保存場所
	var cubes = [];

	// 動作中キューブ保存場所
	var moving = [];

	var select = {
		axis : "x",
		pos : 0,
	};

	// 動作全体フレーム数
	var Loop = 50;
	// 現在のループフレーム数
	var loop = Loop;

	// 1ループでの回転角度(ラジアン単位)
	var angle = Math.PI / 2 / Loop;

	// クォータニオンオブジェクトの宣言
	var q = new THREE.Quaternion();

	// 回転用の軸
	var Axis = {
		"x" : new THREE.Vector3(1, 0, 0).normalize(),
		"y" : new THREE.Vector3(0, 1, 0).normalize(),
		"z" : new THREE.Vector3(0, 0, 1).normalize()
	};

	// 履歴(軸、位置、方向を組としたオブジェクト配列)
	var memento = [];

	// コマンド予約
	var command = [];

	// 実行中のコマンド
	var current_command;

	// モードタイプ(0: 動作なし 1: 手動 2: 自動)
	var mode = 0;

	/**
	 * 初期化
	 */
	function initCube() {
		// キューブ作成
		cubes = [];
		var count = CubeUtil.count;

		for (var x = 0; x < count; x++) {
			for (var y = 0; y < count; y++) {
				for (var z = 0; z < count; z++) {
					// 外側だけ作る
					if (x === 0 || x === count - 1 || y === 0
							|| y === count - 1 || z === 0 || z === count - 1) {
						var cube = new R_Cube(x, y, z);
						cube.addScene(scene);
						cubes.push(cube);
					}
				}
			}
		}

		// デフォルトの選択状態
		select.axis = "x";
		select.pos = 0;
	}


	function _getRoundParam() {
		var axis = current_command.axis;
		var to = current_command.to;

		// 角速度
		var w = (Math.PI / 2 / Loop);
		// 時間
		var t = loop;

		// 回転方向調整
		if (to === 1) {
			w *= -1;
		}

		// 回転角
		var theta = w * t;

		// 移動量
		var move_0 = -w * Math.sin(theta) * CubeUtil.center;
		var move_1 = w * Math.cos(theta) * CubeUtil.center;
		// 軸に応じて移動量定義
		var _round;
		if (axis === "x") {
			_round = {
				x : 0,
				y : move_0,
				z : move_1,
			}
		} else if (axis === "y") {
			_round = {
				x : move_1,
				y : 0,
				z : move_0,
			}
		} else {
			_round = {
				x : move_0,
				y : move_1,
				z : 0,
			}
		}

		return _round;
	}

	/**
	 * 回転
	 *
	 * @param axis
	 *            軸
	 * @param pos
	 *            位置(0～2)
	 * @param 回転方向(0,1)
	 */
	function _rotate(axis, pos, to, isMem) {
		// 回転行列
		var r_m

		// 回転方向で場合分け
		if (to === 0) {
			// 回転軸と角度からクォータニオンを計算
			q.setFromAxisAngle(Axis[axis], angle);
			// 回転行列を取得
			r_m = getRotateMatrix(angle * Loop)[axis];
		} else {
			q.setFromAxisAngle(Axis[axis], -angle);
			r_m = getRotateMatrix(-angle * Loop)[axis];
		}

		// 操作対象の面を取得
		var surf = cubes.filter(function(item, index) {
			if (item[axis] === pos) {
				// 現在角度をそれぞれ保存
				item.setRad();
				// 先に座標移動
				item.rotateCoordinate(r_m);
				return true;
			}
		});

		// 動作中キューブとして保存
		moving = surf;

		if (isMem) {
			// 履歴
			memento.push({
				axis : axis,
				pos : pos,
				to : to,
			});
		}

		// ループ初期化
		loop = 0;
	}

	function rotateManual(val) {
		// 動作なしの時のみ受付
		if (mode === 0 || mode === 1) {
			// コマンド予約に追加
			command.push({
				axis : select.axis,
				pos : select.pos,
				to : val,
				// このコマンド実行時に履歴を取るフラグ
				mem : true,
			});
			// 手動モード開始
			mode = 1;
		}
	}

	// レンダリングでの更新
	function render() {
		if (loop < Loop) {
			// var _round = _getRoundParam();
			var rad = (Math.PI / 2 / Loop) * (loop + 1);
			// 回転方向調整
			if (current_command.to === 1) {
				rad *= -1;
			}

			// 操作対象に対しての処理
			for ( var i in moving) {
				// 回転
				moving[i].rotate(q);

				// 移動
				moving[i].moveRound(current_command.axis, rad);
			}

			// ループフレーム増
			loop++;
		} else {
			// 1ループ終了
			if (command.length > 0) {
				// 次の動作準備(先入れ先だし)
				var m = command[0];
				// 現在コマンドとして保存
				current_command = command[0];
				// 回転
				_rotate(m.axis, m.pos, m.to, m.mem);
				// 選択状態にしておく
				select.axis = m.axis;
				select.pos = m.pos;
				setColor();

				// コマンドから削除
				command.splice(0, 1);
			} else {
				if (mode !== 0) {
					// // クリア判定
					// setClear();
					// 操作終了
					mode = 0;
				}
			}
		}
	}


	function setColor() {
		for ( var i in cubes) {
			var c = cubes[i];
			var s = (c[select.axis] === select.pos);
			c.setSelect(s);
		}
	}

	function selectAxis(val) {
		select.axis = val;
		setColor();
	}

	function selectPos(val) {
		if (val === 0) {
			// プラス
			select.pos = (select.pos + CubeUtil.count - 1) % CubeUtil.count;
		} else {
			// マイナス
			select.pos = (select.pos + 1) % CubeUtil.count;
		}
		setColor();
	}

	return {
		cubes : cubes,
		initCube : initCube,
		rotate : rotateManual,
		render : render,
		selectAxis : selectAxis,
		selectPos : selectPos,
	};
})();
