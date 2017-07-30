using UnityEngine;

public class GridGenerator : MonoBehaviour {
    public ChangeMaterialOnClick emptyGridCell;
    public ConnectToServer server;
    public PlayerColor playerColor;
    public PlayerColor enemyColor;
    public uint width;
    public uint height;

	// Use this for initialization
	void Start () {
        for (uint x = 0; x < width; x++) {
            for (uint y = 0; y < height; y++) {
                var cell = Instantiate(emptyGridCell, new Vector3(x, y, transform.position.z), Quaternion.identity, transform) as ChangeMaterialOnClick;
                cell.playerColor = playerColor;
                cell.enemyColor = enemyColor;
                cell.server = server;
                cell.x = x;
                cell.y = y;
                cell.gameObject.SetActive(true);
                cell.gameObject.name = "" + x + y;
            }
        }
	}

	// Update is called once per frame
	void Update () {

	}
}
