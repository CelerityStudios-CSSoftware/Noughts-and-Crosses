using UnityEngine;

public partial class Match : MonoBehaviour {
    private static Match _instance;
    private const int NONE = -1;

    private int[,] _grid;
    public int currentTurnPlayerID;

    public static Match instance {
        get {
            if (!_instance && !(_instance = FindObjectOfType<Match>())) {
                Debug.LogError("There needs to be one active Match component on a GameObject in your scene");
            }
            return _instance;
        }
    }

    void Start() {
        _grid = new int[3, 3];
        currentTurnPlayerID = -1;
    }

    public bool PlayMove(uint x, uint y) {
        if (_grid[x, y] != 0) return false;
        _grid[x, y] = currentTurnPlayerID;
        //TODO use player manager to get material from playerID
        _updateTileMaterial(x, y, null);
        _checkEndGame();
        return true;
    }

    private void _checkEndGame() {
        //TODO actually check for the end of the game
        return;
    }

    //TODO move this feature to Grid class
    private void _updateTileMaterial(uint x, uint y, Material material) {
        ChangeMaterialOnClick tileComponent;
        string tileName = TileInfo.BuildTileName(x, y);

        if ((tileComponent = _getTileComponent(tileName)) == null) return;
        //TODO pass material once changeColor accepts it
        tileComponent.ChangeColor(false);
    }

    private ChangeMaterialOnClick _getTileComponent(string tileName) {
        GameObject obj = GameObject.Find(tileName);
        if (obj == null) return null;
        return obj.GetComponent<ChangeMaterialOnClick>();
    }
}
