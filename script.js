// Inicializar o mapa
let map = L.map('map').setView([-27.639443, -48.666803], 13);

// Camada de Mapa OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

let marcadores = {};  // Para armazenar os ônibus no mapa

// Dados dos CSVs
let linhasJO = {};
let linhasPH = {};

// Carregar CSVs
function carregarCSV() {
    Papa.parse('data/LinhasJO.csv', {
        download: true,
        header: true,
        complete: function(results) {
          linhasJO = processarCSV(results.data);
        }
      });
      
    Papa.parse('data/LinhasPH.csv', {
        download: true,
        header: true,
        complete: function(results) {
          linhasPH = processarCSV(results.data);
        }
      });
}

function processarCSV(data) {
  let linhas = {};
  data.forEach(function(row) {
    linhas[row["Linha"]] = row["Linha nome"];
  });
  return linhas;
}

// Obter nome da linha baseado no código do veículo
function obterNomeDaLinha(veiNroGestor) {
  let prefixo = veiNroGestor.includes("JO") ? "JO" : "PH";
  let numeroLinha = veiNroGestor.split(" ")[0];  // Extrai o número antes do hífen ou espaço

  if (prefixo === "JO" && linhasJO[numeroLinha]) {
    return linhasJO[numeroLinha];
  } else if (prefixo === "PH" && linhasPH[numeroLinha]) {
    return linhasPH[numeroLinha];
  }
  return "Linha não encontrada";
}

// Adicionar ou atualizar ônibus no mapa
function adicionarOnibusNoMapa(veiculo) {
  let nomeLinha = obterNomeDaLinha(veiculo.vei_nro_gestor);

  let icone;
  if (veiculo.descricao.startsWith("JO")) {
    icone = L.icon({ iconUrl: 'icons/bus-icon-green.png', iconSize: [25, 25] });
  } else if (veiculo.descricao.startsWith("PH")) {
    icone = L.icon({ iconUrl: 'icons/bus-icon-orange.png', iconSize: [25, 25] });
  }

  // Atualizar ou adicionar marcador no mapa
  if (marcadores[veiculo.cod_veiculo]) {
    marcadores[veiculo.cod_veiculo].setLatLng([veiculo.latitude, veiculo.longitude]);
  } else {
    let marker = L.marker([veiculo.latitude, veiculo.longitude], { icon: icone })
      .addTo(map)
      .bindPopup(`
        <h3>${veiculo.descricao}</h3>
        <p>Velocidade: ${veiculo.velocidade} km/h</p>
        <p>Direção: ${veiculo.direcao}°</p>
        <p>Linha: ${nomeLinha}</p>
      `);
    marcadores[veiculo.cod_veiculo] = marker;
  }
}

// Função de filtragem
function filtrarOnibus() {
  let termoBusca = document.getElementById("buscaOnibus").value.toUpperCase();
  
  Object.keys(marcadores).forEach(cod_veiculo => {
    if (marcadores[cod_veiculo].getPopup().getContent().includes(termoBusca)) {
      marcadores[cod_veiculo].addTo(map);
    } else {
      map.removeLayer(marcadores[cod_veiculo]);
    }
  });
}

// Simulação do carregamento do JSON e atualização do mapa a cada 15 segundos
function carregarJSON() {
    fetch('https://cors-anywhere.herokuapp.com/http://citgis.metropolisc.com.br:9977/gtfs-realtime-exporter/findAll/json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao carregar dados JSON');
        }
        return response.json();
      })
      .then(data => {
        data.forEach(veiculo => {
          if (veiculo.descricao.startsWith("JO") || veiculo.descricao.startsWith("PH")) {
            adicionarOnibusNoMapa(veiculo);
          }
        });
        document.getElementById("erro").style.display = "none";  // Esconde mensagem de erro ao sucesso
      })
      .catch(error => {
        console.error('Erro:', error);
        document.getElementById("erro").style.display = "block";  // Mostra mensagem de erro
      });
}
  
// Carregar CSVs e começar o loop de atualização
carregarCSV();
setInterval(carregarJSON, 35000); // Atualiza a cada 35 segundos
