using UnityEngine;

public class TileInfo : MonoBehaviour {
    public uint x;
    public uint y;

    public static string BuildTileName(uint x, uint y) {
        return "" + x + ":" + y;
    }

    public string BuildTileName() {
        return TileInfo.BuildTileName(x, y);
    }
}