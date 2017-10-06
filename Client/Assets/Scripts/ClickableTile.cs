using UnityEngine;

[RequireComponent(typeof(TileInfo))]
[RequireComponent(typeof(MaterialChanger))]
public class ClickableTile : MonoBehaviour {
    private TileInfo _tileInfo;

    void Start() {
        _tileInfo = GetComponent<TileInfo>();
    }

    void OnMouseDown() {
        if (Match.instance.currentTurnPlayerID != PlayerManager.instance.Self().id) {
            Debug.Log("You can't play when it's not your turn");
            return;
        }
        if (Match.instance.PlayMove(_tileInfo.x, _tileInfo.y)) {
            Server.instance.WriteToServer("m:" + _tileInfo.BuildTileName() + "\n");
        } else {
            Debug.Log("Invalid move");
        }
    }
}