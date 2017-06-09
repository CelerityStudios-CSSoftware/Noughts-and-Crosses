using UnityEngine;
using System.Collections;

public class GridGenerator : MonoBehaviour {
    public Transform EmptyGridCell;
    public uint width;
    public uint height;

	// Use this for initialization
	void Start () {
        for (uint x = 0; x < width; x++) {
            for (uint y = 0; y < height; y++) {
                Instantiate(EmptyGridCell, new Vector3(x, y, transform.position.z), Quaternion.identity, transform);
            }
        }
	}

	// Update is called once per frame
	void Update () {

	}
}
