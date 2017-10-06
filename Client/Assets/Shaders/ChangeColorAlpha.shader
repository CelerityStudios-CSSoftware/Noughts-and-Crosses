Shader "Custom/myChangeColorAlpha" {
  Properties {
    _AlphaColor ("Alpha Color", Color) = (1.0, 1.0, 1.0, 1.0)
    _MainTex ("Texture", 2D) = "white" {}
    _Cutoff ("Alpha cutoff", Range(0,1)) = 0.5
  }
  SubShader {
    Tags { "RenderType" = "Opaque" }
    CGPROGRAM
    #pragma surface surf Lambert
    struct Input {
      float2 uv_MainTex;
    };
    sampler2D _MainTex;
    float4 _AlphaColor;
    float _Cutoff;
    void surf (Input IN, inout SurfaceOutput o) {
      float4 col = tex2D (_MainTex, IN.uv_MainTex);
      o.Albedo = col.rgb;
      if (col.a < _Cutoff) {
        o.Albedo = _AlphaColor.rgb;
      }
      o.Alpha = col.a;
    }
    ENDCG
  }
  Fallback "Diffuse"
}