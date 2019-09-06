const Lock = artifacts.require("Lock");

contract('Lock', (accounts) => {
    const months3 = 3;
    const months6 = 6;
    const months12 = 12;
    const day = 60*60*24;
  
    it('lock period should be 3,6,12 && rate should be less than 10000', async () => {
        const lockInstance = await Lock.deployed();

        
        const monthsX = 10;
        try{
            await lockInstance.applyQuota(monthsX, 250, {value: web3.utils.toWei('1', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "lock period error, tx reverted");
        }

        let rate = 10001;
        try{
            await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('12000', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months3, 250, {value: web3.utils.toWei('12000', 'ether')});
        }catch(error) {
            assert(false);
        }
    });

    it('value should be grater than 0', async () => {
        const lockInstance = await Lock.deployed();

        let rate = 10;

        try{
            await lockInstance.applyQuota(months3, rate);
        }catch(error) {
            assert.include(error.toString(), "revert", "value error, tx reverted");
        }
    });
  
    it('_amountPerMonth, _nextPayTime, _unlockTime should be correct', async () => {
        const lockInstance = await Lock.deployed();

        let lockInfo = await lockInstance.pays.call(accounts[0]);
        assert.equal(web3.utils.fromWei(lockInfo[0]), 25, "amountPerMonth should be 25");
        assert.equal(web3.utils.fromWei(lockInfo[4]), 12000, "capital should be 12000 ether");
    });

    it('to address should not be 0', async () => {
        const lockInstance = await Lock.deployed();

        try{
            await lockInstance.withdraw('0x0000000000000000000000000000000000000000');
        }catch(error) {
            assert.include(error.toString(), "revert", "to address error, tx reverted");
        }
    });

    it('fromAddr should have applied for quota or be in lock time', async () => {
        const lockInstance = await Lock.deployed();

        try{
            await lockInstance.withdraw(accounts[0]);
        }catch(error) {
            assert.include(error.toString(), "revert", "from address error, tx reverted");
        }
    });

    it('one address should lock only once', async () => {
        const lockInstance = await Lock.deployed();

        let rate = 12;

        // await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('10', 'ether')});
        try{
            await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('10', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "lock address error, tx reverted");
        }
    });

    it('rate should be consistent', async () => {
        const lockInstance = await Lock.deployed();

        let rate250 = 250;
        let rate275 = 275;
        let rate300 = 300;
        let rate325 = 325;
        let rate350 = 350;
        let rate400 = 400;

        //month == 3
        try{
            await lockInstance.applyQuota(months3, rate250+1, {from: accounts[1] ,value: web3.utils.toWei('10', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months3, rate275+1, {from: accounts[2] ,value: web3.utils.toWei('1000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months3, rate325+1, {from: accounts[3] ,value: web3.utils.toWei('10000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        //month == 6
        try{
            await lockInstance.applyQuota(months6, rate275+1, {from: accounts[4] ,value: web3.utils.toWei('10', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months6, rate300+1, {from: accounts[5] ,value: web3.utils.toWei('1000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months6, rate350+1, {from: accounts[6] ,value: web3.utils.toWei('10000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        //month == 12
        try{
            await lockInstance.applyQuota(months12, rate325+1, {from: accounts[7] ,value: web3.utils.toWei('10', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months12, rate350+1, {from: accounts[8] ,value: web3.utils.toWei('1000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months12, rate400+1, {from: accounts[9] ,value: web3.utils.toWei('10000001', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate consistence error, tx reverted");
        }

        await lockInstance.applyQuota(months3, rate250, {from: accounts[1] ,value: web3.utils.toWei('10', 'ether')});
        await lockInstance.applyQuota(months3, rate275, {from: accounts[2] ,value: web3.utils.toWei('1000001', 'ether')});
        await lockInstance.applyQuota(months3, rate325, {from: accounts[3] ,value: web3.utils.toWei('10000001', 'ether')});

        await lockInstance.applyQuota(months6, rate275, {from: accounts[4] ,value: web3.utils.toWei('10', 'ether')});
        await lockInstance.applyQuota(months6, rate300, {from: accounts[5] ,value: web3.utils.toWei('1000001', 'ether')});
        await lockInstance.applyQuota(months6, rate350, {from: accounts[6] ,value: web3.utils.toWei('10000001', 'ether')});

        await lockInstance.applyQuota(months12, rate325, {from: accounts[7] ,value: web3.utils.toWei('10', 'ether')});
        await lockInstance.applyQuota(months12, rate350, {from: accounts[8] ,value: web3.utils.toWei('1000001', 'ether')});
        await lockInstance.applyQuota(months12, rate400, {from: accounts[9] ,value: web3.utils.toWei('10000001', 'ether')});
    });

    it('set rate', async () => {
        const lockInstance = await Lock.deployed();

        await lockInstance.setRate(3, 100, 200, 300);

        let rate = await lockInstance.rates.call(3, 0);
        assert.equal(rate, 100, "rates[3][0] should be 100");
    });

    // it('withdraw correctly', async () => {
    //     const lockInstance = await Lock.deployed();
        
    //     // 90 days later
    //     let passby = day * 90;
    //     await web3.currentProvider.send({
    //         jsonrpc: "2.0", 
    //         method: "evm_increaseTime", 
    //         params: [passby], 
    //         id: 0
    //     });
    //     await web3.currentProvider.send({
    //         jsonrpc: "2.0", 
    //         method: "evm_mine", 
    //         params: [], 
    //         id: 0
    //     });
        
    //     try{
    //         await lockInstance.withdraw(accounts[1], {from: accounts[1]});
    //     }catch(error) {

    //     }

    // });

});
