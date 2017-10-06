using UnityEngine;

public partial class Match : MonoBehaviour {
    private static Match _instance;
    private const int NONE = -1;
    private const int GRID_SIZE = 3;

    private int[,] _grid;
    private int _winner;
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
        _grid = new int[GRID_SIZE, GRID_SIZE];
        Reset();
        Server.instance.Unpause();
    }

    void Reset() {
        for (int y = 0; y < GRID_SIZE; y++) {
            for (int x = 0; x < GRID_SIZE; x++) {
                _grid[x, y] = NONE;
            }
        }
        currentTurnPlayerID = 0;
        _winner = NONE;
    }

    public bool PlayMove(uint x, uint y) {
        if (_grid[x, y] != NONE || _winner != NONE) return false;
        _grid[x, y] = currentTurnPlayerID;
        Player currentPlayer = PlayerManager.instance.GetPlayerFromId(currentTurnPlayerID);
        _updateTileMaterial(x, y, currentPlayer.icon.material);
        return true;
    }

    public void SetWinner(int playerId) {
        Debug.Log("The winner is player " + playerId);
        _winner = playerId;
        var announcement = FindObjectOfType<Announcement>();
        string message;
        if (PlayerManager.instance.Self().id == _winner) {
            message = "You won!";
        } else {
            message = "Player " + _winner + " won!";
        }
        announcement.Show(message, Announcement.ShowType.PERSIST);
    }

    //TODO move this feature to Grid class
    private void _updateTileMaterial(uint x, uint y, Material material) {
        MaterialChanger tileComponent;
        string tileName = TileInfo.BuildTileName(x, y);

        if ((tileComponent = _getTileComponent(tileName)) == null) return;
        tileComponent.ChangeMaterial(material);
    }

    private MaterialChanger _getTileComponent(string tileName) {
        GameObject obj = GameObject.Find(tileName);
        if (obj == null) return null;
        return obj.GetComponent<MaterialChanger>();
    }
}
