/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';
import { MakeFundignAccountDto } from '../dtos/make-funding-account.dto';
import { AlpacaBrokerService } from 'src/alpaca_broker/services/alpaca_broker.service';
import { Role } from 'src/roles-permission/entities/role.entity';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private hashingProvider: HashingProvider,
    @Inject(forwardRef(() => AlpacaBrokerService))
    private alpacaBrokerService: AlpacaBrokerService,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createAccountDto.password,
    );

    // Busca el rol por defecto "usuario"
    const rolUsuario = await this.roleRepository.findOne({
      where: { name: 'usuario' },
    });

    if (!rolUsuario) {
      throw new HttpException(
        'Rol por defecto "usuario" no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Crea la cuenta con el rol asociado
    const account = this.accountRepository.create({
      ...createAccountDto,
      password: hashedPassword,
      roles: [rolUsuario], // <-- Aquí se asigna el rol
    });

    try {
      await this.accountRepository.save(account);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException('Error creando cuenta', HttpStatus.BAD_REQUEST);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fundingAccount(makeFundignAccountDto: MakeFundignAccountDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.alpacaBrokerService.makeFundignAccount(makeFundignAccountDto);
  }

  async checkExistenceAccount(
    email?: string,
    accountId?: number,
    accountIdAlpaca?: string,
  ) {
    let findAccount: null | Account = null;
    try {
      if (email) {
        findAccount = await this.accountRepository.findOneBy({ email });
      } else if (accountId) {
        findAccount = await this.accountRepository.findOneBy({ id: accountId });
      } else if (accountIdAlpaca) {
        findAccount = await this.accountRepository.findOneBy({
          alpaca_account_id: accountIdAlpaca,
        });
      }
      return findAccount;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {
        description: 'Se presento un error en la operacion, intente luego',
      });
    }
  }

  // En accounts.service.ts
  async findByEmail(email: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { email },
      relations: ['user'],
    });
    if (!account) {
      throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
    }
    return account;
  }

  async findByEmailWithUserAndRoles(email: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { email },
      relations: ['user', 'roles'],
    });
    if (!account) {
      throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
    }
    return account;
  }

  async updatePassword(accountId: number, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashingProvider.hashPassword(newPassword);

    try {
      await this.accountRepository.update(accountId, {
        password: hashedPassword,
        last_access: new Date(), // Actualizar último acceso
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Error actualizando contraseña',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    console.log('Actualizando password en la base para account id:', accountId);
    console.log('Nuevo password:', newPassword);
    console.log('Nuevo hash a guardar:', hashedPassword);
  }
  // accounts.service.ts
  async findByUserId(accountId: number): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { id: accountId }, // Busca por el ID autoincremental de la cuenta
    });
  }

  // Encuentra cuenta con sus roles
  async findByIdWithRoles(id: number): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  // Actualiza los roles de la cuenta
  async updateAccountRoles(
    id: number,
    roleIds: number[],
  ): Promise<{ message: string; roles: string[] }> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    // ¡No olvides tener roleRepository inyectado!
    const roles = await this.roleRepository.findByIds(roleIds);
    account.roles = roles;
    await this.accountRepository.save(account);
    return { message: 'Roles actualizados', roles: roles.map((r) => r.name) };
  }

  async updateEmail(accountId: number, newEmail: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    account.email = newEmail;
    return this.accountRepository.save(account);
  }
}
