using UnityEngine;

public class GridGenerator : MonoBehaviour {
    public ClickableTile emptyGridTile;
    public uint width;
    public uint height;

	// Use this for initialization
	void Start () {
        for (uint x = 0; x < width; x++) {
            for (uint y = 0; y < height; y++) {
                var tile = Instantiate(emptyGridTile, new Vector3(x, y, transform.position.z), Quaternion.identity, transform) as ClickableTile;
                var tileInfo = tile.gameObject.GetComponent<TileInfo>();

                tileInfo.x = x;
                tileInfo.y = y;
                tile.gameObject.SetActive(true);
                tile.gameObject.name = tileInfo.BuildTileName();
            }
        }
	}
}
