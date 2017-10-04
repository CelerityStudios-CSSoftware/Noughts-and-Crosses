using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class MaterialChanger : MonoBehaviour {
    private Renderer _renderer;

    void Start() {
        _renderer = GetComponent<Renderer>();
    }

    public void ChangeMaterial(Material material) {
        _renderer.material = material;
    }
}
