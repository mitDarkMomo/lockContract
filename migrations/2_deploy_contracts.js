const SafeMath = artifacts.require("SafeMath");
const Lock = artifacts.require("Lock");

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, Lock);
  deployer.deploy(Lock);
};
