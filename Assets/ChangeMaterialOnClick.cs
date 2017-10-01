using UnityEngine;

[RequireComponent(typeof(Renderer))]
[RequireComponent(typeof(TileInfo))]
public class ChangeMaterialOnClick : MonoBehaviour {
    public PlayerColor playerColor;
    public PlayerColor enemyColor;

    private Renderer _renderer;
    private TileInfo _tileInfo;

    void Start() {
        _renderer = GetComponent<Renderer>();
        _tileInfo = GetComponent<TileInfo>();
    }

    // Update is called once per frame
	void OnMouseDown() {
        Debug.Log("Tile " + _tileInfo.BuildTileName() + " clicked");
        //TODO implement PlayerManager to allow checking whether it's our turn
        //if (Match.instance.currentTurnPlayerID != PlayerManager.instance.self()) {
        //    Debug.Log("You can't play when it's not your turn");
        //    return;
        //}
        if (Match.instance.PlayMove(_tileInfo.x, _tileInfo.y)) {
            Server.instance.WriteToServer("m:" + _tileInfo.BuildTileName() + "\n");
        }
	}

    public void ChangeColor(bool selfColor) {
        _renderer.material = (selfColor ? playerColor.color : enemyColor.color);
    }
}
